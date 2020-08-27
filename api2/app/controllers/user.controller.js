/*
ROUTES ARE MANAGED BY CONTROLLERS:
If you look inside routes you will see that there are calls such as
the retrieval of users but these matters are held by a controller
to prevent the API from being publicly exploitable.

HTTP STATUS CODES - FOR RESTFUL APIs (it is important)

1xx	-	INFORMATION	:	Transfer protocol level information
2xx	-	SUCCESS		:	Indicates that the client's request was accepted successfully
3xx	-	REDIRECTION	:	Indicates that the client must take additional action in order to complete the request
4xx	-	CLIENT ERROR:	Error status codes points the finger at the client
5xx	-	SERVER ERROR:	The server takes responsibility for these error status codes

201	-	CREATED		:	Resource has been created inside a collection
202	-	ACCEPTED	:	Indicates that request has been accepted but processing is not complete
204	-	NO CONTENT	:	Response to a PUT, POST, Delete request if API decline to send back a status message

301	-	MOVED (PERM):	The API has been redesigned and a new URI has been assigned to the client's requested resource.
302	-	FOUND		:	This is a way of telling the browser to redirect by making the same request to a different URI
303	-	SEE OTHER	:	
304	-	NOT MODIFIED:	Similar to 204 but when there is no body
307	-	TEMP REDIRECT:	Indicates API is not going to process the client's request

400	-	BAD REQUEST	:	Generic client-side error
401	-	Unauthorized:	Caused by a failure to authenticate
403	-	Forbidden	:	Indicates a client's request is formed correctly but the REST API refuses to honour it.
404	-	Not Found	:	The API can't map the client's URI to a resource but may be available in the future.
405	-	Method NotAllowed	:	Client used an HTTP method the resource does not allow.
406	-	Not Acceptable	:	

500	-	Internal Server Error:	There is an exception that caused an error
501	-	Not Implemented	:	Server does not recognise the request method

*/
const User = require("../models/user.model");
const email = require("../config/email.config");


//Create and Save a new User
exports.create = (req, res) => {
	//Validate request
	if (!req.body)	{
		res.status(400).send({
			message: "Content can not be empty!"
		});
	}

	//Create a User
	const user = new User({
		username: req.body.username,
		firstname: req.body.firstname,
		lastname: req.body.lastname,
		email: req.body.email,
		password: req.body.password,
	});

	//Save User in the database
	User.create(user, (err, userdata) => {
		if (err)
			res.status(500).send({
				message:
					err.message || "Some error occurred while creating the User."
			});
		
		console.log("creating activation code:");
		let userId  = userdata.id
		let code = randomString(14);

		const activation = new ActivationCode({userId, code})
		ActivationCode.create(activation, (err, data) => {
			if (err)
				res.status(500).send({
					message:
						err.message || "Some error occurred while creating the User."
				});


			email.activationEmail(userdata.email, userId, code);
			res.send(userdata);
		});
	});
};

//Retrieve all Users from the database.
exports.findAll = (req, res) => {
	User.getAll((err, data) => {
		if (err)
			res.status(500).send({
				message:
					err.message || "Some error occured while retrieving users."
			});
		else res.send(data);
	});
};

//Retrieve a single User with a userId in the request
exports.findOne = (req, res) => {
	User.findById(req.params.userId, (err, data) => {
		if (err) {
			if (err.kind === "not_found") {
				res.status(404).send({
					message: `Not found User with id ${req.params.userId}.`
				});
			} else {
				res.status(500).send({
					message: "Error retrieving User with id " + req.params.userId
				});
			}
		} else res.send(data);			
	});
};

//Update a single User with a userId in the request
exports.update = (req, res) => {
	//Validate Request
	if (!req.body) {
		res.status(400).send({
			message: "Content can not be empty"
		});
	}

	User.updateById(
		req.params.userId,
		new User(req.body),
		(err, data) => {
			if (err) {
				if (err.kind === "not_found") {
					res.status(404).send({
						message: `Not found User with id ${req.params.userId}.`
					});
				} else {
				res.status(500).send({
					message: "Error updating User with id " + req.params.userId
					});
				}
			} else res.send(data);
		}
	);
};

//Delete a User with the specified userId in the request
exports.delete = (req, res) => {
	User.remove(req.params.userId, (err, data) => {
		if (err) {
			if (err.kind === "not_found") {
				res.status(404).send({
					message: `Not found User with id ${req.params.userId}.`
				});
			}else {
				res.status(500).send({
					message: "Could not delete User with id " + req.params.userId
				});
			}
		}else res.send({ message: `User was deleted successfully!`});
	});
};

//Delete all Users from the Database
exports.deleteAll = (req, res) => {
	User.removeAll((err,data) => {
		if (err) {
			res.status(500).send({
				message: err.message || "Some error occured while removing all users."
			});
		}else res.send({ message: "All Users were deleted successfully!" });
	});
};

//LOGIN HANDLER

exports.login = (req, res) => {
	User.findLogin(req.body.login, req.body.password, (err, data) => {
		if (err) {
			if (err.kind === "not_found") {
				res.status(404).send({
					message: `404: Username not found with name: ${req.body.login.value}.`
				});
			} else {
				res.status(500).send({
					message: "500: Error retrieving User with username: " + req.body.login["value"] //TODO: Please finish the log in sequence here
				});
			}
		} else res.send(data);
	});
};

//SIGN UP WITH ENCRYPTION

//Create and Save a new User
exports.signup = (req, res) => {
	//Validate request
	if (!req.body)	{
		res.status(400).send({
			message: "Content can not be empty!"
		});
	}

	// username min length 3
	if (!req.body.username || req.body.username.length < 3) {
		return res.status(400).send({
			msg: 'Please enter a username with min. 3 chars'
		});
	}

	// password min 6 chars
	if (!req.body.password || req.body.password.length < 10) {
		return res.status(400).send({
			msg: 'Please enter a password with min. 6 chars'
		});
	}
	
	// password (repeat) does not match
	if (!req.body.confirmpassword || req.body.password != req.body.confirmpassword) {
		return res.status(400).send({
			msg: 'Both passwords must match'
		});
	}

	//Create a User
	const user = new User({
		username: req.body.username,
		firstname: req.body.firstname,
		lastname: req.body.lastname,
		email: req.body.email,
		password: req.body.password
	});

	//Save User in the database
	User.signup(user, (err, data) => {
		if (err) {
			if (err.kind === "inUse") {
				res.status(409).send({
					message: `409: Username already in use`
				});
			} else if (err.kind === "bcrypt err") {
				res.status(500).send({
					message: `Unknown Bcrypt failure`
				});
			}
			else {
				res.status(500).send({
					message:
						err.message || "Some error occurred while creating the User."
				});
			}
		}	
		else res.send(data);
	});
};


exports.activate = (req, res) => {
	//Validate Request
	User.updateByIdCode(req.params.userId, req.params.activationKey, (err, data) => {
		if (err) {
			if (err.kind === "not_found") {
				res.status(404).send({
					message: `This key is invalid, please request a new activation code!`
				});
			} else if (err.kind === "db") {
				res.status(404).send({
					message: `Unable to update Database at this moment`
				});
			} else {
				res.status(500).send({
					message: `Error retrieving User with id ${req.params.userId} or key ${req.params.activationKey}.`
				});
			}
		} else res.send(data);			
	});
};

function randomString(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }