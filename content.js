const host = 'http://localhost:11434';   // default, change if you used a different port

async function chat(ticketDetails) {
    
  const host = 'http://localhost:11434';
  
  // Construct the prompt using your ticketDetails
  const prompt = `
  אני משתמש ב servicenow ואני רוצה שתיצור לי סטטוס על incident. צירפתי אובייקט שמכיל את הפרטים אסביר מה אני רוצה שתיצור על פי הפרטים:
            אני רוצה שהתשובה תיראה כך בעברית כמובן:
            מספר טיקט: ticketNumber שמופיע באובייקט
            מצב: state שמופיע באובייקט
            לקוח: caller שמופיע באובייקט
            כותרת: shortDescription שמופיע באובייקט
            סטטוס: ב סטטוס אני רוצה שתסכם מה שמופיע ב shortDescription ב description וב comments בצורה שתתאר את הבעיה כפי שהלקוח תיאר ב shortDescription
            ואם יש תגובות נוספות ב comments שמתייחסות לתיאור הבעיה תוסיף גם אותן לתיאור הבעיה. שיים לב שכשאתה מסתכל על התגובות מצורף מי הגיב.
            אם המגיב הוא ה caller זה תגובה של הלקוח.
            אם המגיב הוא supporter זה אומר שמישהו מצוות אחר הגיב על זה אז צריך לציין את זה כשאתה מוסיף את התגובה לסטטוס אם היא רלוונטית לסטטוס תציין שתומך מצוות אחר הגיב את התגובה
            אם המגיב הוא team supporter למשל Cloud-IT supporter זה אומר שמישהו מהצוות הנוכחי הגיב את התגובה הזאת אז לתגובות האלה תתן את המשקל המשמעותי בסטטוס.
            לתגובות שתומך מצוות אחר הגיב תתייחס כהערה צדדית
            ואז בסטטוס העיקרי תתאר לפי ההתכתבות ולפי מצב הטיקט את התהליך שנעשה כלומר אילו פעולות נעשו על מנת לפתור את התקלה ולמה ממתינים כלומר מה מעכב את פתרון הטיקט.
            יש להתייחס למצב הטיקט אם זה On Hold זה ממתין לתשובת הלקוח. אם זה In Progress זה ממתין לתשובת התומך
            אני לא רוצה שתכתוב את כל התגובות אני רק צריך שתכתוב את הפעולות שנעשו כדי לפתור את הבעיה ואיפה זה עומד עכשיו ותכתוב את זה בצורה של סיכום
            לא צריך לצטט שום דבר בסטטוס
            בסוף אני צריך שסטטוס ייראה כך (בנוסף לכל השדות שציינתי למעלה):
            בעיה:
            צעדים שננקטו:
            בצעדים שננקטו אני רוצה שלא תצטט שום תגובה אני רק רוצה שתסכם את התגובות מה שרלוונטי כמובן לבעיה בתוך תיאור הבעיה ומה שרלוונטי לפתרון לסכם בצעדים שננקטו
            אני מדגיש שוב לא לצטט שום תגובה
            מה קורה עכשיו עם הטיקט:
  ${JSON.stringify(ticketDetails)}`;

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      type: 'chat',
      url: `${host}/api/chat`,
      body: {
        model: 'llama3',
        messages: [{ role: 'user', content: prompt }],
        stream: false
      }
    }, (response) => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      if (response.error) {
        return reject(new Error(response.error));
      }
      
      console.log('Assistant says:', response.data.message.content);
      resolve(response.data.message.content);
    });
  });
}


const main = async () => {
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    const comments = [];


    const snowTeamsMembers = {
        "Cloud-IT": [
            "D Hamneshin",
            "J Oz",
            "B Zur",
            "D Liberman",
            "D Shazo",
            "E Shamailov",
            "Y Itzhaki"
        ]
    }

    let currntTeam = "Cloud-IT";

    const findTicketNumber = async (root = document) => {
        const elements = root.querySelectorAll?.(
            '.sn-chrome-one-tab-label'
        );

        if (elements.length > 0) {

            for (const el of elements) {
                if (el.innerText.includes("INC")) return el.innerText;
            }
        }


        const innerElements = root.querySelectorAll?.("*") || [];

        for (const el of innerElements) {
            if (el.shadowRoot) {
                const result = await findTicketNumber(el.shadowRoot);
                if (result) {
                    return result;
                }
            }
        }

        return undefined;
    }

    const findCaller = async (root = document, targetClass = ".now-heading.-title.-primary.has-no-margin.wont-wrap") => {
        const found = root.querySelector?.(targetClass);
        if (found) {
            return found.innerText;
        }

        const innerElements = root.querySelectorAll?.("*") || [];

        for (const el of innerElements) {
            if (el.shadowRoot) {
                const result = await findCaller(el.shadowRoot, targetClass);
                if (result) {
                    return result;
                }
            }
        }

        return undefined;
    };

    const findSender = (currentSender, caller) => {
        if (currentSender === caller) return "caller";
        else return snowTeamsMembers[currntTeam].includes(currentSender) ? `${currntTeam} supporter` : "supporter"
    }

    const findState = async (root = document) => {
        const found = root.querySelector?.(
            '.needs-clamping[title="On Hold"], .needs-clamping[title="In Progress"]'
        );

        if (found) {
            return found.title;
        }

        const innerElements = root.querySelectorAll?.("*") || [];

        for (const el of innerElements) {
            if (el.shadowRoot) {
                const result = await findState(el.shadowRoot);
                if (result) {
                    return result;
                }
            }
        }

        return undefined;
    };

    const descriptions = [];

    const findDescriptions = async (root = document, descriptions = []) => {
        const innerElements = root.querySelectorAll?.("*") || [];

        const found = root.querySelectorAll?.(".now-align.-block-end");

        if (found.length > 0) {
            descriptions.push(...found);

        }
        if (descriptions.length === 2) return descriptions;

        for (const el of innerElements) {
            if (el.shadowRoot) {
                const result = await findDescriptions(el.shadowRoot, descriptions);
                if (result) return result;
            }
        }

        return undefined;
    }

    const findComments = async (root = document, targetClass = ".sn-as-card-body-journal", comments = [], caller) => {
        let currentSender = "";
        const innerElements = root.querySelectorAll?.("*") || [];
        for (const el of innerElements) {
            if (el.className === "card-info") {
                currentSender = findSender(el.innerText.trim(), caller);
            }
        }

        const found = root.querySelectorAll?.(targetClass);
        if (found.length > 0) {
            comments.push({ comment: found[0].innerText, sender: currentSender });
        }

        for (const el of innerElements) {
            if (el.shadowRoot) {
                await findComments(el.shadowRoot, targetClass, comments, caller);
            }
        }
    }

    async function getElementFromShadowRoot(root = document, targetClass = ".sn-as-card-body-journal", comments = [], caller) {

    }


    async function run() {
        await delay(5000);   // actually waits

        const ticketNumber = await findTicketNumber(document);

        const caller = await findCaller();

        const state = await findState(document);

        const [{ innerText: shortDescription }, { innerText: description }] = await findDescriptions(document, descriptions);

        await findComments(document, ".sn-as-card-body-journal", comments, caller);

        const ticketDetails = { ticketNumber, caller, state, shortDescription, description, comments };
        console.log(JSON.stringify(ticketDetails));


        try {
        await chat(ticketDetails);
    } catch (err) {
        console.error("Ollama Error:", err);
    }


    }

    run();


}
main();