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