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


    }

    run();


}
main();