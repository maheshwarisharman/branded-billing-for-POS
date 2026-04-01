import axios from 'axios'

const AISENSY_API_URL = 'https://backend.aisensy.com/campaign/t1/api/v2'
const AISENSY_API_KEY = process.env.AISENSY_API_KEY
const AISENSY_CAMPAIGN_NAME = process.env.AISENSY_CAMPAIGN_NAME

export const sendWhatsAppMessage = async (phoneNumber: string, bill_id: string, name: string): Promise<boolean> => {
  
  try {
    console.log("HEYYYYY")
    const response = await axios.post(AISENSY_API_URL, {
      apiKey: AISENSY_API_KEY,
      campaignName: AISENSY_CAMPAIGN_NAME,
      destination: `+91${phoneNumber}`,
      userName: name,
      buttons: [
        {
          type: 'button',
          sub_type: `url`,
          index: 0,
          parameters: [{
            type: "text",
            text: `invoice/${bill_id}`
          }]
        }
      ]
    })
    if (response.status === 200 && response.data.success == "true") {
      return true
    }
    console.log(response)
    return false
  } catch (error) {
    console.error(error)
    return false
  }
}