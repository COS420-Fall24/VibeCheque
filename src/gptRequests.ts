import "dotenv/config";
import { OpenAI } from "openai";

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

async function analyzeTone(userText: string): Promise<string> {
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            "role": "system",
            "content": [
              {
                "type": "text",
                "text": `
                  Humans are unpredictable beings. A text message by someone can be interpreted as passive aggressive 
                  or cheerful depending on how the person reads it in their minds. This can lead to misunderstandings. 
                  However, assume you are an expert in understanding human emotions when they send text messages. 
                  I want you to reply to the following texts by giving your best guess about what the person might be 
                  feeling when they wrote it. You are to figure out whether they are sad, mad, happy, neutral, or any 
                  other emotion that the person is conveying. Reply to the following texts in 1-2 words containing the 
                  emotion. Sometimes, the text will contain "@vibecheque". You are to discard that, and only analyze 
                  the rest of the text.
                `
              }
            ]
          },
          {
            "role": "user",
            "content": [
              {
                "type": "text",
                "text": userText
              }
            ]
          }
        ]
    });
    if (response.choices[0].message.content !== null){
        return response.choices[0].message.content;
    }
    else{
        return "Unknown error - can't generate the tone at the moment"
    }
}

export default analyzeTone