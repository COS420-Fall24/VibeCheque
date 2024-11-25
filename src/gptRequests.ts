import "dotenv/config";
import { OpenAI } from "openai";

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

export async function analyzeTone(userText: string): Promise<string> {
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
                  other emotion that the person is conveying. Assume the texter is familiar with the modern day texting conventions.
                  Sometimes, the text will contain "@vibecheque". You are to discard that, and only analyze 
                  the rest of the text.
                  
                  I really want you to tune in to catch potential ambiguous texts. If you think the text might be passive-aggressive 
                  or otherwise an ambiguous tone, such as a text that can be interpreted as content and mad at the same time, I want 
                  you to reply by "I detected ambiguous tone in your message. Are you feeling <tone>, ... or <tone>?". You can add 
                  2-3 potential tones that you think are ambiguous to you.
                  Otherwise, reply to the following texts in 1-2 words containing the emotion.  
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

export async function emojiRepresentation(userText: string): Promise<string> {
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
              other emotion that the person is conveying. Assume the texter is familiar with the modern day texting conventions.
              Sometimes, the text will contain "@vibecheque". You are to discard that, and only analyze 
              the rest of the text.
              
              I want you to tune into the tone behind any messages you receive and reply only with the emoji which best fits.
              If you are unable to determine an emoji for the message, respond only with this emoji: 🛒 
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