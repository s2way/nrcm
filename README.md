# NRCM

NRCM is a Request Controller Model framework for NodeJS.

It is an ultra lightweight implementation of a RESTful API that acts as a content provider.

## Features

* MVC similar design: except for the View, which will be always JSONs;
* Couchbase model support;
* Multi-application: several different applications can run inside the same NodeJS HTTP server;
* Couchbase and MySQL data sources supported;
* Assynchronous logging using winston;

## Setup & Run

1) Create your Node project and install the NRCM dependency locally: 
```bash
$ npm install nrcm
``` 

2) Create your server configuration file and name it config.json:
```json
{
    urlFormat: "/$application/$controller"
}
```
3) Create a file named index.js:
```javascript
var NRCM = require('nrcm');
var instance = new NRCM();
instance.configure('config.json'); // Your server configuration JSON file
// The name of your application 
// If you are not going to use the multi-app feature, name it "app".
instance.setUp('app'); 
instance.start('127.0.0.1', 3333); // Start your server
```
4) Start your server by typing: `node index.js`

Your server should be running now. NRCM will automatically create the folder structure of your application.

## Folder Structure

The line `instance.setUp('app')` will create the application folder structure if it does not exist. Your project should look something like this:

```
├── config.json
├── app/
│   ├── src/
│   │   ├── Config/
│   │   ├───├── core.json
│   │   ├── Component/
│   │   ├── Controller/
│   │   ├── Model/
│   ├── test/
│   │   ├── Component/
│   │   ├── Controller/
│   │   ├── Model/
├── index.js
```

## Documentation

### Server Configuration

### Controllers

### Models

