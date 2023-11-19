export const addSignUpTagToContact = async (email: string) => {

    const obj = {
        email,
        "fieldValues": [
            {
                "field": "33",  // Replace with your tag field ID
                "value": "Wavs Users"  // Replace with the tag name you want to add
            }
        ]
    }
    try {
      const response = await fetch(
        "https://suavekeys.api-us1.com/api/3/contacts",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Api-Token":
              process.env.ACTIVE_CAMPAIGN_API_KEY as string,
            },
            body: JSON.stringify(obj)
          }
      );
  
      const data = await response.json();
  
      if (response.status === 200) {
        const apolloPurchasers: string[] = data.contacts.map(
          (contact: any) => contact.email
        );
  
        return apolloPurchasers.includes(email);
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }

  };