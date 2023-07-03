# Axelor Apps

⚠️ This application is no longer maintained. It is replaced by Axelor Open Mobile as of version 6.4.0 of Axelor Open Suite. ⚠️

## About

### Technologies

- [React](https://reactjs.org/) as JS library for front-end.
- [Cordova](https://cordova.apache.org/) as mobile framework.
- [Lerna](https://lerna.js.org/) as multi-package build tools.

### Packages

- web-client: Providing abstraction classes, interfaces and React HOC (Redux-connector) for manage models coming from AOP-like WebService.
- web-client-adk: First implementation of web-client for AOP with basic models from AOS.
- web-client-adk-module: Extension of web-client-adk.
- web-ui: Main application build in React
  - web-ui/public_app: Cordova application

## Install

```bash
npm install
npx lerna run prepublish
npx lerna bootstrap -- --legacy-peer-deps
```

## Start

For start the project in development environment (react in browser), you can run:

```bash
cd packages/web-ui
npm start
```

If you have edited files in a `web-client[-xxx]` directory, you should rerun `npx lerna run prepublish` for apply change in `web-ui`.

## Build

```bash
cd packages/web-ui
npm run build
```

### Android

#### Requirements

- Java 8
- Gradle

#### Install

```bash
cd packages/web-ui/public_app
npm install
npx cordova@8.1.1 platform add android
```

#### Build Android APK/App bundle

Before building Android APK, you should always build React application.
All React files are build into `packages/web-ui/public_app/www` directory.

The following commands are used to create an APK. To create an aab file, please add `-- --packageType=bundle` at the end of the command.

##### Debug

```bash
cd packages/web-ui/public_app
npx cordova@8.1.1 build android
```

##### Release

```bash
cd packages/web-ui/public_app
npx cordova@8.1.1 build android --release
```

To sign APK or aab file, you need to add the keystore file and add a build.json file in packages/web-ui/public_app/ folder with the following props :

```json
{
  "android": {
    "release": {
      "keystore": "***",
      "storePassword": "***",
      "alias": "***",
      "password": "***"
    }
  }
}
```
