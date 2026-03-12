
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const elements = [];

async function getElementFromShadowRoot(root = document, targetClass = ".sn-as-card-body-journal", elements = []) {

    const found = root.querySelectorAll?.(targetClass);
    if (found) {
        elements.push(...found);
    }

    const innerElements = root.querySelectorAll?.("*") || [];

    for (const el of innerElements) {
        if (el.shadowRoot) {
            await getElementFromShadowRoot(el.shadowRoot, targetClass, elements);
        }
    }
}

async function run() {
    await delay(5000);   // actually waits
    await getElementFromShadowRoot(document, ".sn-as-card-body-journal", elements);
    console.log(elements);
    elements.forEach((el) => {
        console.log(el.innerText);

    })
}

run();

