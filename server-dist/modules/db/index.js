"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getPostData = exports.saveImageToPost = exports.uploadImage = exports.savePost = exports.checkAdmin = exports.saveUser = void 0;

var _firebase = require("../../config/firebase");

var _utilities = require("../utilities");

/*rules, all get function must return an pure, immutable object type data */

/*user */
const saveUser = async (accountType, userData) => {
  try {
    let {
      user_id
    } = userData;
    let dataToSave = {};

    for (let key in userData) {
      dataToSave = { ...dataToSave,
        [key]: userData[key]
      };
    }

    return _firebase.database.ref(`users/${accountType}/${user_id}`).set(dataToSave);
  } catch (e) {
    throw new Error(e);
  }
};

exports.saveUser = saveUser;

const getUserData = async (accountType, userID) => {
  let [userData, userErr] = await (0, _utilities.wrapPromise)(_firebase.database.ref(`users/${accountType}/${userID}`).once("value"));

  if (userErr) {
    throw new Error(userErr);
  }

  return userData.val();
};
/**admin */


const checkAdmin = async userID => {
  let [userAdminSnapshot, err] = await (0, _utilities.wrapPromise)(_firebase.database.ref(`admins/${userID}`).once('value'));

  if (err) {
    throw new Error(err);
  }

  return userAdminSnapshot.val();
};
/*post */


exports.checkAdmin = checkAdmin;

const savePost = async (title, contents, imageTitles, endpoint = "queue", author) => {
  let newPostRef = _firebase.database.ref(`posts/${endpoint}`).push(); //push images first with fake urls


  let newImagesRef = newPostRef.child("images");
  let [imageIDs, setImageErr] = await (0, _utilities.wrapPromise)(Promise.all(imageTitles.map(async title => {
    let imageRef = newImagesRef.push();
    let [, setImageFakeErr] = await (0, _utilities.wrapPromise)(imageRef.set({
      url: "haha",
      title
    }));

    if (setImageFakeErr) {
      throw new Error(setImageFakeErr);
    }

    return imageRef.key;
  })));

  if (setImageErr) {
    console.log(setImageErr);
    throw new Error(setImageErr);
  } //set contents and title


  let newPostContentRef = newPostRef.child("contents");
  let [, setPostErr] = await (0, _utilities.wrapPromise)(Promise.all([...contents.map(async content => {
    for (let contentKey in content) {
      if (contentKey === "imageIndex") {
        if (content[contentKey] === -1) {
          content[contentKey] = null;
        } else {
          content[contentKey] = imageIDs[content[contentKey]];
        }
      } else {
        if (!content[contentKey]) {
          content[contentKey] = null;
        }
      }
    }

    let [, setPostContentErr] = await (0, _utilities.wrapPromise)(newPostContentRef.push().set(content));

    if (setPostContentErr) {
      throw new Error(setPostContentErr);
    }

    return "ok";
  }), newPostRef.update({
    title,
    author
  })]));

  if (setPostErr) {
    console.log(setPostErr);
    throw new Error(setPostErr);
  }

  return {
    key: newPostRef.key,
    imageIDs
  };
};

exports.savePost = savePost;

const uploadImage = async (file, id) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject("No image to upload here");
    }

    let newName = `${id}.${getFileExtenstion(file.originalname)}`;

    let fileUpload = _firebase.storage.file(newName);

    let blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype
      }
    });
    blobStream.on('error', error => {
      reject(error);
    });
    blobStream.on("finish", async () => {
      const url = `https://storage.googleapis.com/${_firebase.storage.name}/${fileUpload.name}`;
      let [, err] = await (0, _utilities.wrapPromise)(fileUpload.makePublic());

      if (err) {
        reject(err);
      }

      resolve(url);
    });
    blobStream.end(file.buffer);
  });
};

exports.uploadImage = uploadImage;

const saveImageToPost = async (imageKeys, imageURLs, endpoint, key) => {
  let postImageRef = _firebase.database.ref(`posts/${endpoint}/${key}/images`);

  return Promise.all(imageKeys.map(async (imageKey, index) => {
    let url = imageURLs[index];
    return postImageRef.child(imageKey).update({
      url
    });
  }));
}; //if pagination added : just choose the limit number larger than number of children of a post


exports.saveImageToPost = saveImageToPost;

const getPostData = async (endpoint, id = "") => {
  let [postData, error] = await (0, _utilities.wrapPromise)(_firebase.database.ref(`posts/${endpoint}/${id}`).once("value"));

  if (error) {
    throw new Error(error);
  }

  postData = postData.val();

  if (id && id.length) {
    let {
      accountType,
      id
    } = postData['author'];
    let [authorData, getAuthorErr] = await (0, _utilities.wrapPromise)(getUserData(accountType, id));

    if (getAuthorErr) {
      throw new Error(getAuthorErr);
    }

    postData['author'] = authorData;
  }

  return postData;
};
/*helpers */


exports.getPostData = getPostData;

const getFileExtenstion = filename => {
  return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
};