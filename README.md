# prerequisites

Your laptop/machine must have these setup:

1. node & npm

```
Download & setup node software.
https://nodejs.org/en/

```

2. cordova - Install cordova cli using this command

```
sudo npm install -g cordova
```

3. lerna - Install lerna

```
npm install -g lerna
```

## Installation & project run instructions

1. Clone project from git.
2. Now you need to install packages so run below command:

```
npm install
```

3. Now you need to build project so run below command:

```
npm run build
```

If you don't have lerna then you need to install it via below command:

```
npm install -g lerna
```

After installing command you need to run again build command (Point 3).

4. Now Project is ready to run:
   To run project use below command,

```
npm start
```

Note: You can also use yarn commands if you don't want to use npm.

## APK generation & signing instructions:

Follow below steps to build an apk:

1. Go To root of project and run below command:

```
npm run build
```

2. Now go to web ui folder & build it:

```
cd packages/web-ui

npm run build
```

3. After this go to public_app folder:

```
cd public_app
```

4. Here you need to add cordova platform (one time only):

```
cordova platform add android
```

5. Then build apk using these command, 

Note: you must have android sdk setup in current terminal. So it can build apk.

```
cordova build android
```

To generate signed apk:

- You need to have keystore file to sign an apk. 
Then use below command to generate signed apk.

```
cordova build android --release -- --keystore="<Path-to-keystore-file>" --storePassword=<storePassword> --alias=<alias-name> --password=<password>
```