const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

admin.initializeApp();
const db = admin.firestore();
const app = express();

const whitelist = [
  "http://localhost:3000",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

const appCheckVerification = async (req, res, next) => {
  const appCheckToken = req.header("X-Firebase-AppCheck");

  if (!appCheckToken) {
    // res.status(401);
    res.status(200).json({ status: 0 });
    return next("successfull");
  }

  try {
    // await firebaseAdmin.appCheck().verifyToken(appCheckToken);
    if (appCheckToken === `appCheckTokenResponse.token`) return next();
  } catch (err) {
    res.status(401);
    return next("Unauthorized");
  }
};

app.get("/", (req, res) => res.status(200).send("hi!"));
app.get("/test", (req, res) => res.status(200).send("hi test!"));

app.post("/saveCourse", [appCheckVerification], async (req, res) => {
  const { title, description, chapters } = req.body;
  try {
    // const data = await admin.auth().verifyIdToken(userToken);
    // const email = data.email;

    // if (!email) {
    //   return res.status(200).json({ status: -1, data: [] });
    // }

    const email = "tukuna.patro@gmail.com";
    const _title = title.split(" ").join("_");

    const result = await db
      .collection("courses")
      .doc(`${_title}_${email}`)
      .set({
        title,
        description,
        chapters,
        created_at: Date.now(),
        author: email,
        state: "draft",
      });

    return res.status(200).json({ status: 1, data: result });
  } catch (error) {
    return res.status(200).json({ status: -1, error });
  }
});

app.post("/getCourses", [appCheckVerification], async (req, res) => {
  // const { userToken } = req.body;
  try {
    // const data = await admin.auth().verifyIdToken(userToken);
    // const email = data.email;

    // if (!email) {
    //   return res.status(200).json({ status: -1, data: [] });
    // }

    const email = "tukuna.patro@gmail.com";

    const courses = [];
    await db
      .collection("courses")
      .where("authorEmail", "==", email)
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          // doc.data() is never undefined for query doc snapshots
          console.log(doc.id, " => ");
          courses.push(doc.data());
        });
      })
      .catch((error) => {
        console.log("Error getting documents: ", error);
      });

    console.log('courses', courses);

    return res.status(200).json({ status: 1, data: courses });
  } catch (error) {
    return res.status(200).json({ status: -1, error });
  }
});

exports.skillRazrTest = functions.region("asia-south1").https.onRequest(app);
