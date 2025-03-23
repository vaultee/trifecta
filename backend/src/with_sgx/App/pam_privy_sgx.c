#define PAM_SM_AUTH
#include <security/pam_modules.h>
#include <security/pam_ext.h>
#include <sgx_urts.h>
#include <curl/curl.h>
#include "sgx_wrapper.h"

#define PRIVY_API_URL "https://api.privy.io/v1/wallets"
#define PRIVY_APP_ID "your_app_id"
#define PRIVY_APP_SECRET "your_app_secret"

static size_t write_callback(void *ptr, size_t size, size_t nmemb, void *userdata) {
    strncat((char *)userdata, (char *)ptr, size * nmemb);
    return size * nmemb;
}

int pam_sm_authenticate(pam_handle_t *pamh, int flags, int argc, const char **argv) {
    sgx_enclave_id_t enclave_id;
    sgx_status_t status;
    char response[4096] = {0};
    char wallet_address[256] = {0};

    // Initialize SGX Enclave
    if (initialize_enclave(&enclave_id) != SGX_SUCCESS) {
        pam_syslog(pamh, LOG_ERR, "Failed to initialize SGX enclave");
        return PAM_AUTH_ERR;
    }

    // Make a request to Privy API to get the wallet-based username
    CURL *curl = curl_easy_init();
    if (!curl) {
        pam_syslog(pamh, LOG_ERR, "CURL initialization failed");
        return PAM_AUTH_ERR;
    }

    curl_easy_setopt(curl, CURLOPT_URL, PRIVY_API_URL);
    curl_easy_setopt(curl, CURLOPT_HTTPGET, 1L);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_callback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, response);

    struct curl_slist *headers = NULL;
    headers = curl_slist_append(headers, "Content-Type: application/json");
    headers = curl_slist_append(headers, "privy-app-id: " PRIVY_APP_ID);
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    curl_easy_setopt(curl, CURLOPT_USERNAME, PRIVY_APP_ID);
    curl_easy_setopt(curl, CURLOPT_PASSWORD, PRIVY_APP_SECRET);

    CURLcode res = curl_easy_perform(curl);
    curl_easy_cleanup(curl);
    curl_slist_free_all(headers);

    if (res != CURLE_OK) {
        pam_syslog(pamh, LOG_ERR, "Failed to fetch wallet info from Privy API");
        return PAM_AUTH_ERR;
    }

    // Extract wallet address from response (Basic JSON parsing)
    sscanf(response, "{\"wallet_address\":\"%255[^\"]\"}", wallet_address);

    // Validate wallet address inside SGX enclave
    int auth_result = 0;
    status = ecall_authenticate_wallet(enclave_id, &auth_result, wallet_address);

    // Destroy enclave
    sgx_destroy_enclave(enclave_id);

    return (status == SGX_SUCCESS && auth_result) ? PAM_SUCCESS : PAM_AUTH_ERR;
}

int pam_sm_setcred(pam_handle_t *pamh, int flags, int argc, const char **argv) {
    return PAM_SUCCESS;
}