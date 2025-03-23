```
gcc -fPIC -shared -o pam_privy.so pam_privy.c -lpam -lcurl
sudo cp pam_privy.so /lib/security/
sudo chmod 644 /lib/security/pam_privy.so
```
