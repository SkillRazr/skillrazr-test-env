const getCourses = async () => {
    return await fetch(
        `http://localhost:5001/skillrazr-mobile/asia-south1/skillRazrTest/getCourses`,
        {
            headers: {
                'X-Firebase-AppCheck': 'appCheckTokenResponse.token'
            },
            method: 'POST',
            body: JSON.stringify({})
        }
    ).then((resp) => resp.json());
}


export const saveCourse = async (payload) => { // pass proper payload
    const baseUrl = "http://localhost:5001/skillrazr-mobile/asia-south1/skillRazrTest/getCourses"
    
    return await fetch(baseUrl, {
      headers: {
        "Content-Type": "application/json",
        "X-Firebase-AppCheck": `appCheckTokenResponse.token`,
      },
      method: "POST",
      body: JSON.stringify(payload),
    }).then((resp) => resp.json());
  };



  export const updateToggle = async (id, toggleValue) => {
    const baseUrl = process.env.REACT_APP_ENV
      ? "https://asia-south1-genlent-8aab7.cloudfunctions.net/skillRazrIntern-api/updateToggle"
      : "http://127.0.0.1:5001/genlent-8aab7/asia-south1/skillRazrIntern-api/updateToggle";
  
    return await fetch("http://127.0.0.1:5001/skillrazr-mobile/asia-south1/skillRazrTest", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        id,
        toggleValue
      }),
    }).then((resp) => resp.json());
  };
  
  export const getIntern = async (email) => {
    const baseUrl = process.env.REACT_APP_ENV
      ? "https://asia-south1-genlent-8aab7.cloudfunctions.net/skillRazrIntern-api/getIntern"
      : "http://127.0.0.1:5001/genlent-8aab7/asia-south1/skillRazrIntern-api/getIntern";
  
    return await fetch("http://127.0.0.1:5001/skillrazr-mobile/asia-south1/skillRazrTest", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        email,
      }),
    }).then((resp) => resp.json());
  };