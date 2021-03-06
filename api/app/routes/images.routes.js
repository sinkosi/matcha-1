module.exports = app => {

    const images = require("../controllers/images.controller")
    
//     //Retrieve all images
    app.get("/images", images.findAllImg)
    
//     //Create new Image
    // app.post("/images", images.imgCreate);

    app.post("/images/upload/:userId", images.upload)

//     //Find Image by Image ID
    app.get("/images/:imageId", images.findOneImg);

//     //Find Image by User ID
    app.get("/users/:userId/images", images.findByUserId);

//     //Delete An Image
    app.delete("/images/:imageId", images.deleteOneImage);
};