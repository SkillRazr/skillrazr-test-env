const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

admin.initializeApp();
const db = admin.firestore();
const app = express();

const whitelist = ["http://localhost:3000"];

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

    console.log("courses", courses);

    return res.status(200).json({ status: 1, data: courses });
  } catch (error) {
    return res.status(200).json({ status: -1, error });
  }
});

app.post("/addIntern", async (req, res) => {
  const { name, email, mobileNo, joinDate, github, linkedin, notes } = req.body;

  // if (req.header("skillrazr-sub-app") !== env.INTERN_API_HEADER_KEY_VALUE) {
  // return res.status(401).json({ status: 0, error: "you are not authorised" });
  // }

  try {
    const db = admin.firestore();
    const ref = db.collection("interns").doc(email);
    const doc = await ref.get();

    if (doc.exists) {
      return res
        .status(200)
        .json({ status: 0, message: "Can't add, intern exists already!" });
    }

    const dateObj = new Date(joinDate);

    // 3 months internship, Jan-Mar, Apr-Jun, July-Sep, Oct-Dec
    const month1Year = "Apr_2023";
    const month2Year = "May_2023";
    const month3Year = "Jun_2023";

    const result = db
      .collection("interns")
      .doc(email)
      .set({
        name,
        email,
        notes,
        joinDate,
        github,
        linkedin,
        mobileNo,
        performanceData: {
          [month1Year]: {},
          [month2Year]: {},
          [month3Year]: {},
        },
      });

    return res.status(200).json({ status: 1, data: result });
  } catch (error) {
    return res.status(409).json({ status: -1, error });
  }
});

app.post("/getAllInterns", async (req, res) => {
  try {
    const db = admin.firestore();

    const interns = [];
    const internsRef = db.collection("interns");
    const snapshot = await internsRef.get();

    snapshot.forEach((doc) => {
      const { performanceData, ...rest } = doc.data();

      interns.push({ ...rest });
    });

    return res.status(200).json({ status: 1, data: interns });
  } catch (error) {
    return res.status(500).json({ status: -1, error });
  }
});

app.post("/updateInternsAttendance", async (req, res) => {
  // if (req.header("skillrazr-sub-app") !== env.INTERN_API_HEADER_KEY_VALUE) {
  // return res.status(401).json({ status: 0, error: "you are not authorised" });
  // }

  try {
    const { date, docIds } = req.body;
    const db = admin.firestore();

    const dateObj = new Date(date);
    const formattedDate = dateObj.toISOString();
    // ToDo - add validation to allow updates only from a date from the internship duration

    const monthYear = `May_2023`;

    const updateBatch = db.batch();

    for (let docId of docIds) {
      let docRef = db.collection("interns").doc(docId);
      const doc = await docRef.get();
      const performanceData = doc.data().performanceData;

      if (!performanceData[monthYear]) {
        performanceData[monthYear] = {};
      }

      const absentArray = performanceData[monthYear].absentDays || [];
      performanceData[monthYear].absentDays = [...absentArray, formattedDate];
      updateBatch.update(docRef, { performanceData });
    }

    const result = await updateBatch.commit();
    res.status(200).json({ status: 1, data: result });
  } catch (error) {
    console.log("error", error);
    res.status(409).json({ status: -1, error });
  }
});

app.post("/updateInternNotes", async (req, res) => {
  // if (req.header("skillrazr-sub-app") !== env.INTERN_API_HEADER_KEY_VALUE) {
  //   return res.status(401).json({ status: 0, error: "you are not authorised" });
  // }

  const db = admin.firestore();
  const { date, note, docId } = req.body;
  console.log(note, docId);

  try {
    const dateObj = new Date(date);
    console.log(dateObj);
    const formattedDate = dateObj.toISOString();

    const monthYear = "May_2023";

    const internRef = db.collection("interns").doc(docId);
    const internDoc = await internRef.get();
    const performanceData = internDoc.data().performanceData;

    if (!performanceData[monthYear]) {
      performanceData[monthYear] = {};
    }
    const notes = performanceData[monthYear].notes || [];
    notes.push({ ...note, formattedDate });

    console.log(2);
    performanceData[monthYear].notes = notes;

    await internRef.update({ performanceData });
    res.status(200).json({ status: 1, data: performanceData });
  } catch (error) {
    return res.status(500).json({ status: -1, error });
  }
});

app.post("/getInternPerfomanceData", async (req, res) => {
  const { accessToken } = req.body;

  const db = admin.firestore();

  try {
    const data = await admin.auth().verifyIdToken(accessToken);
    const email = data.email;
    const internsRef = db.collection("interns").doc(email);
    const doc = await internsRef.get();

    if (doc.exists) {
      return res.status(200).json({ status: 1, data: doc.data() });
    } else {
      return res
        .status(200)
        .json({ status: 0, message: "no such user exists!" });
    }
  } catch (error) {
    return res.status(200).json({ status: -1, error });
  }
});

app.post("/updateToggle", async (req, res) => {
  const { accessToken, toggleValue } = req.body;

  const db = admin.firestore();

  try {
    // Update the state in Firebase
    const data = await admin.auth().verifyIdToken(accessToken);
    const email = data.email;
    const docRef = db.collection("interns").doc(email);
    await docRef.update({
      profilePublic: toggleValue,
      profilePublicUpdatedOn: new Date().toISOString(),
    });
    res.status(200).json({ status: 1 });
  } catch (error) {
    console.log("data in toggle ", error);
    return res.status(500).json({ status: -1, error });
  }
});

app.post("/getIntern", async (req, res) => {
  try {
    const { email } = req.body;
    const db = admin.firestore();

    const internsRef = db.collection("interns").doc(email);
    const doc = await internsRef.get();

    const { performanceData, profilePublic, ...rest } = doc.data();

    return res
      .status(200)
      .json({ status: 1, data: profilePublic ? doc.data() : { ...rest } });
  } catch (error) {
    return res.status(500).json({ status: -1, error });
  }
});

app.post("/postScores", async (req, res) => {
  // if (req.header("skillrazr-sub-app") !== env.INTERN_API_HEADER_KEY_VALUE) {
  //   return res.status(401).json({ status: 0, error: "you are not authorised" });
  // }

  const db = admin.firestore();
  const { scores, email } = req.body;

  const dateObj = new Date().toISOString();

  try {
    const monthYear = `${getMonthName(
      dateObj.getMonth()
    )}_${dateObj.getFullYear()}`;

    const internRef = db.collection("interns").doc(email);
    const internDoc = await internRef.get();
    const performanceData = internDoc.data().performanceData;

    if (!performanceData[monthYear]) {
      performanceData[monthYear] = {};
    }
    const Scores = {
      code_reviews: scores.codeReview,
      develpoment: scores.development,
      learning: scores.learning,
      testing: scores.testing,
    };

    if (!performanceData[monthYear].scores) {
      performanceData[monthYear].scores = Scores;
      await internRef.update({ performanceData });
      res.status(200).json({ status: 1, data: performanceData });
    }
    res.status(200).json({ status: 0});
  } catch (error) {
    return res.status(500).json({ status: -1, error });
  }
});

app.post("/postList", async (req, res) => {
  // if (req.header("skillrazr-sub-app") !== env.INTERN_API_HEADER_KEY_VALUE) {
  //   return res.status(401).json({ status: 0, error: "you are not authorised" });
  // }

  const { payload: list }  = req.body
  const db = admin.firestore();

  try {
    const boardRef = db.collection("boards").doc("RVqKBADpFoUaXfKSabUX")
    const boardData = await boardRef.get();
    const settings = boardData.data().settings || [];
    const updatedList = [ ...settings, list ];
    await boardRef.update({settings : updatedList});
  } catch (error) {
    return res.status(500).json({ status: -1, error });
  }
});

app.post("/addCard", async (req, res) => {
  // if (req.header("skillrazr-sub-app") !== env.INTERN_API_HEADER_KEY_VALUE) {
  //   return res.status(401).json({ status: 0, error: "you are not authorised" });
  // }

  const { payload: card }  = req.body
  const db = admin.firestore();

  try {
    const boardRef = db.collection("boards").doc("RVqKBADpFoUaXfKSabUX")
    const boardData = await boardRef.get();
    const cards = boardData.data().cards || [];
    const updatedCard = [ ...cards, card ];
    await boardRef.update({cards : updatedCard});
  } catch (error) {
    return res.status(500).json({ status: -1, error });
  }
});

app.post("/getBoard", async (req, res) => {
  // if (req.header("skillrazr-sub-app") !== env.INTERN_API_HEADER_KEY_VALUE) {
  //   return res.status(401).json({ status: 0, error: "you are not authorised" });
  // }

  // const {startDate} = req.body
  const db = admin.firestore();

  try {
    const boardRef = db.collection("boards").doc("RVqKBADpFoUaXfKSabUX")
    const boardData = await boardRef.get();
    return res.status(200).json({ status: 1, data: boardData.data() });
  } catch (error) {
    return res.status(500).json({ status: -1, error });
  }
});


app.post("/postBoard", async (req, res) => {
  // if (req.header("skillrazr-sub-app") !== env.INTERN_API_HEADER_KEY_VALUE) {
  //   return res.status(401).json({ status: 0, error: "you are not authorised" });
  // }

  const {payload} = req.body;
  console.log(payload);
  const db = admin.firestore();

  try {
    const boardRef = db.collection("boards")
    await boardRef.set(payload)
  } catch (error) {
    return res.status(500).json({ status: -1, error });
  }
});

app.post("/updateBoard", async (req, res) => {
  // if (req.header("skillrazr-sub-app") !== env.INTERN_API_HEADER_KEY_VALUE) {
  //   return res.status(401).json({ status: 0, error: "you are not authorised" });
  // }

  const {payload} = req.body;
  const db = admin.firestore();

  try {
    const boardRef = db.collection("boards").doc("RVqKBADpFoUaXfKSabUX")
    await boardRef.update({ settings: payload.settings, cards: payload.cards });
    return res.status(200).json({ status: 1 });
  } catch (error) {
    return res.status(500).json({ status: -1, error });
  }
});

exports.api = functions.region("asia-south1").https.onRequest(app);

exports.skillRazrTest = functions.region("asia-south1").https.onRequest(app);
