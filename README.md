# CoD4x-WebAdmin

A Real Time Application for CoD4x Game Servers built using Node.js, Express, Mongoose, Socket.io, Passport & MongoDB.

## Demo
Check [Demo](https://www.cirkus-serveri.com)

## Features

+ Uses Express as the application Framework.
+ Manages Sessions using [express-session](https://github.com/expressjs/session) package.
+ Authenticates via username and password using [Passport](https://github.com/jaredhanson/passport).
+ Passwords are hashed using [bcrypt-nodejs](https://github.com/shaneGirish/bcrypt-nodejs) package.
+ Social Authentication via Facebook, Google+, Steam and Twitter using [Passport](https://github.com/jaredhanson/passport).
+ Real-time communication between a client and a server using [Socket.io](https://github.com/socketio/socket.io).
+ Uses [MongoDB](https://github.com/mongodb/mongo), [Mongoose](https://github.com/Automattic/mongoose) and [MongoLab(mLab)](https://mlab.com/) for storing and querying data.
+ Stores session in a [MongoDB](https://github.com/mongodb/mongo) using [connect-mongo](https://github.com/kcbanner/connect-mongo); a MongoDB-based session store.


## Installation
### Running Locally
Make sure you have [Node.js](https://nodejs.org) and [npm](https://www.npmjs.com) installed.

+ Clone or Download the repository


	```
	$ git@github.com:byNeHo/CoD4x-WebAdmin.git
	$ cd cod4xwebadmin
	```

+ Install Dependencies

	```
	$ npm install
	```

+ Edit configuration file in _app/config/config.json_ with your credentials.
+ Download and Install [MongoDB](https://www.mongodb.com).
+ Start the application

	```
	$ npm start
	```

Your app should now be running on [localhost:3000](http://localhost:3000).

## Help/Support
Please visit our [Forum](https://forum.cirkus-serveri.com).


## License
CoD4x-WebAdmin is licensed under the GNU General Public License v3 (GPL-3) (http://www.gnu.org/copyleft/gpl.html).

Interested in a sublicense agreement for use of CoD4x-WebAdmin in a non-free/restrictive environment? Contact us at nehogroup@gmail.com.