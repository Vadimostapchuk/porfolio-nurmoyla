routerAdd("GET", "/static/*", $apis.staticDirectoryHandler("./pb_public/static", false))

routerAdd("GET", "/", (c) => {
    try {
    const define = require(`${__hooks}/define.js`)
    let records = define.findRecordsByFilter("relax", `id!=""`)
    let cottages = define.findRecordsByFilter("cottage", `id!=""`)
    let reviews = define.findRecordsByFilter("reviews", `id!=""`)
    let contact = define.findFirstRecordByFilter("contacts", `id="qdurudrxxm2vcwv"`)
    contact = contact.publicExport()
    let newRecords = []
        records.forEach((record) => {
        let data = record.publicExport()
        newRecords.push(data)
        })
    let newcottages = []
        cottages.forEach((cot) => {
        let data = cot.publicExport()
        newcottages.push(data)
        })
    let newreviews = []
        reviews.forEach((cot) => {
        let data = cot.publicExport()
        newreviews.push(data)
        })
    const html = $template.loadFiles(
        `${__hooks}/views/layout.html`,
        `${__hooks}/views/index.html`,
    ).render({
        "records": newRecords,
        "cottages": newcottages,
        "contact": contact,
        "reviews": newreviews,
    })

    return c.html(200, html)}
    catch (e) { console.log(e); return c.string(500, `${e.stack}`) }
})

routerAdd("GET", "/details/:id", (c) => {
    try {
    const define = require(`${__hooks}/define.js`)
    let id = c.pathParam("id")
    let record = define.findFirstRecordByFilter("cottage", `id="${id}"`)
    let over_records = define.findRecordsByFilter("cottage", `id!="${id}"`)
    let newRecords = []
        over_records.forEach((record) => {
        let data = record.publicExport()
        newRecords.push(data)
        })
    let html = ""
    let contact = define.findFirstRecordByFilter("contacts", `id="qdurudrxxm2vcwv"`)
    contact = contact.publicExport()
    if (record) {
        record = record.publicExport()
        html = $template.loadFiles(
            `${__hooks}/views/layout.html`,
            `${__hooks}/views/details.html`,
        ).render({
            "cottage": record,
            "contact": contact,
            "over_records": newRecords,
        })
    }
    if (!record) {
        html = $template.loadFiles(
            `${__hooks}/views/layout.html`,
            `${__hooks}/views/details.html`,
        ).render({

        })
    }

    return c.html(200, html)}
    catch (e) { console.log(e); return c.string(500, `${e.stack}`) }
})

routerAdd("POST", "/order", (c) =>{
    try{
        const define = require(`${__hooks}/define.js`)
        const data = $apis.requestInfo(c).data
        define.updateOrCreateOfKey("mail", "email", data.user_email, {
            "name": data.user_name,
            "phone": data.user_phone,
            "messege": data.user_messege,
            "date_first": data.user_date,
            "date_second": data.user_date2,
            "select": data.user_select
        })
        return c.redirect(302, "/?showModal")
    }
    catch (e) { console.log(e); return c.string(500, `${e.stack}`) }
})