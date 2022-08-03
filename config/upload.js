const multer = require("multer");
const fs = require("fs");

module.exports = {
	profileUploader: (directory, prefix) => {
		// default directory
		let defaultDir = "./public";

		// multer configuration
		const storageUploader = multer.diskStorage({
			destination: (req, file, callback) => {
				const pathDir = directory ? defaultDir + directory : defaultDir;
                const isAuthorized = req.dataToken.id == req.params.id;

				// checking path directory
				if (fs.existsSync(pathDir) && isAuthorized) {
					// storing file if directory exists
					return callback(null, pathDir);
				} 

                if (!isAuthorized) {
                    callback(new Error("Upload denied. Forbidden activity.", false));
                    return 
                } 

                fs.mkdir(pathDir, { recursive: true }, (err) => {
                    if (err) {
                        console.log("Failed creating directory | error:", err);
                    }
                    console.log(pathDir, "created successfuly");
                    return callback(err, pathDir);
                });
			},
			filename: (req, file, callback) => {
				// define allowes file extension
				let extension = file.originalname.split(".");
                let newName = `${prefix}_${req.dataToken.id}_${Date.now()}.${extension[extension.length - 1]}`;
				callback(null, newName);
			},
		});

		const fileFilter = (req, file, callback) => {
			const allowedExtension = /\.(jpg|png|webp|jpeg|svg)/;

			if (!file.originalname.toLowerCase().match(allowedExtension)) {
				callback(new Error("Upload denied: image extension must be jpg, png, webp, jpeg or svg", false));
                return
			} 

            callback(null, true);
		};

		return multer({ storage: storageUploader, fileFilter });
	},
	postUploader: (directory, prefix) => {
		// default directory
		let defaultDir = "./public";

		// multer configuration
		const storageUploader = multer.diskStorage({
			destination: (req, file, callback) => {
				const pathDir = directory ? defaultDir + directory : defaultDir;

				// checking path directory
				if (fs.existsSync(pathDir)) {
					// storing file if directory exists
					return callback(null, pathDir);
				}

                fs.mkdir(pathDir, { recursive: true }, (err) => {
                    if (err) {
                        console.log("Failed creating directory | error:", err);
                    }
                    console.log(pathDir, "created successfuly");
                    return callback(err, pathDir);
                });
			},
			filename: (req, file, callback) => {
				// define allowes file extension
				let extension = file.originalname.split(".");
                let newName = `${prefix}_${req.dataToken.id}_${Date.now()}.${extension[extension.length - 1]}`;
				callback(null, newName);
			},
		});

		const fileFilter = (req, file, callback) => {
			const allowedExtension = /\.(jpg|png|webp|jpeg|svg)/;

			if (!file.originalname.toLowerCase().match(allowedExtension)) {
				callback(new Error("Upload denied: image extension must be jpg, png, webp, jpeg or svg", false));
                return
			} 

            callback(null, true);
		};

		return multer({ storage: storageUploader, fileFilter });
	},
};
