url shortener
=============
a personal url shortener server

conf
----
create a file ./secret/secret.json, users' passwords are stored in sha1
```
{
  "creds":
  {
        "user1": "62cdb7020ff920e5aa642c3d4066950dd1f01f4d",
        "user2": "0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33"
  }  
}
```

quickstart
----------
```
npm install
./run.sh
```
