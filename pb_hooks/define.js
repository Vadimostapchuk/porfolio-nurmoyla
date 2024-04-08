/// <reference path="../pb_data/types.d.ts" />

module.exports = {
  // "undefined" instead of "throw"
  findCollectionByNameOrId: findCollectionByNameOrId,
  findRecordById: findRecordById,
  findFirstRecordByData: findFirstRecordByData,
  findFirstRecordByFilter: findFirstRecordByFilter,
  findRecordsByFilter: findRecordsByFilter,
  saveRecord: saveRecord,

  // helpers
  getOrCreateOfKey: getOrCreateOfKey,
  updateOrCreateOfKey: updateOrCreateOfKey,

  // work with batch items
  updateOrCreateItems: updateOrCreateItems,

  // helpers for logging
  formatError: formatError,
  sendLogToPocketbase: sendLogToPocketbase,
  printError: printError,
  sendErrorToTG: sendErrorToTG,
}

function findCollectionByNameOrId(nameOrId) {
  let collection = undefined
  try {
    collection = $app.dao().findCollectionByNameOrId(nameOrId);
  } catch { }
  return collection
}

function findRecordById(nameOrId, recordId, ...optFilters) {
  let record = undefined
  try {
    record = $app.dao().findRecordById(nameOrId, recordId, ...optFilters)
  } catch { }
  return record
}

function findFirstRecordByData(nameOrId, key, value) {
  let record = undefined
  try {
    record = $app.dao().findFirstRecordByData(nameOrId, key, value)
  } catch { }
  return record
}

function findFirstRecordByFilter(collectionNameOrId, filter, ...params) {
  let record = undefined
  try {
    record = $app.dao().findFirstRecordByFilter(collectionNameOrId, filter, ...params)
  } catch { }
  return record
}

function findRecordsByFilter(nameOrId, filter, sort, limit, offset, ...params) {
  let records = []
  try {
    records = $app.dao().findRecordsByFilter(nameOrId, filter, sort, limit, offset, ...params)
  } catch { }
  return records
}

function saveRecord(record) {
  try {
    $app.dao().saveRecord(record)
  } catch (err) {console.log(err);}
}

function getOrCreateOfKey(collectionNameOrId, key, value, data={}) {
  let record = findFirstRecordByData(collectionNameOrId, key, value)
  if (record) return record

  const collection = findCollectionByNameOrId(collectionNameOrId);
  if (!collection) return undefined

  record = new Record(collection, {})
  record.set(key, value)
  for (let key in data) {
    record.set(key, data[key])
  }
  saveRecord(record)
  return findFirstRecordByData(collectionNameOrId, key, value)
}

function updateOrCreateOfKey(collectionNameOrId, key, value, data={}) {
  let record = findFirstRecordByData(collectionNameOrId, key, value)
  if (!record) {
    const collection = findCollectionByNameOrId(collectionNameOrId);
    if (!collection) return
    record = new Record(collection, {})
    record.markAsNew()
  } else {
    record.markAsNotNew()
  }
  record.set(key, value)
  for (let key in data) {
    record.set(key, data[key])
  }
  saveRecord(record)
}

function sendLogToPocketbase(logCollectionNameOrId, method, data={}) {
  updateOrCreateOfKey(logCollectionNameOrId, "method", method, data)
}

function updateOrCreateItems(collectionNameOrId, items, fields, unique_field) {
  if (items.length == 0) return null
  const collection = $app.dao().findCollectionByNameOrId(collectionNameOrId);
  if (!collection) return
  const headers = fields.length != 0 ? Object.keys(items[0]).filter(key => fields.includes(key)) : Object.keys(items[0])
  unique_field = unique_field ? unique_field : 'article'

  try {
    $app.dao().runInTransaction((txDao) => {
      for (let item of items) {
        // check if article already exists
        try {
          const filter = $app.dao().findFirstRecordByData(collectionNameOrId, unique_field, item[unique_field])
          const record = $app.dao().findRecordById(collectionNameOrId, filter.id)

          for (let header of headers) {
            record.set(header, item[header])
          }

          txDao.saveRecord(record)


          //console.log(`updated record ${item[unique_field]}`)

        } catch {
          const new_record = new Record(collection, {
            unique_field: item[unique_field]
          })
          for (let header of headers) {
            // console.log(header)
            new_record.set(header, item[header])
          }
          // console.log(new_record.article)

          txDao.saveRecord(new_record)
          //console.log(`created_record ${item[unique_field]}`)
        }
      }
    })
  } catch (err) {
    printError("logs_internal_api", "define.updateOrCreateItems", err, "")
    return err
  }

  return null
}

function formatError(err) {
  if (!err) return ""
  if (err.stack == undefined || err.stack == "") return err.message
  return err.stack
}

function printError(logCollectionNameOrId, method, err, description_or_processingTime, sendToTG=true) {
  if (!err) {
    let processingTime = Number(description_or_processingTime)
    sendLogToPocketbase(logCollectionNameOrId, method, {"description": "OK", "time": processingTime})
    return
  }
  let description = String(description_or_processingTime)
  console.log(`${method}: ${description}: ${formatError(err)}`);
  sendLogToPocketbase(logCollectionNameOrId, method, {"description": description+": "+formatError(err), "time": 0})
  if (sendToTG) return sendErrorToTG(method, err, description)
  return null
}

function sendErrorToTG(method, err, description) {
  if (!err) return null
  try {
    let getAutorizationData = () => {
      let dataR = findFirstRecordByFilter("authorizations", `id!=""`)
      if (dataR && (dataR.getString("telegram") != "" && dataR.getString("telegram") != "null")) {
        let data = JSON.parse(dataR.getString("telegram"))
        return [true, data["name"], data["tgs"]]
      }
      return [false, "", []]
    }

    let [ok, service, tgs] = getAutorizationData()
    if (!ok) return new Error("tg: authorization not found")

    let data = {
			"service": service,
			"method": method,
			"error": String(err.message),
			"description": description,
			"canFix": true,
			"line": -1,
		}

    let errs = []

    tgs.forEach((tg) => {
      const resp = $http.send({
        url: tg.curl+"/write-error",
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "content-type": "application/json",
          "Authorization": tg.authorization
				},
        timeout: 300 // in seconds
      })

      if (resp.statusCode != 200) {
        errs.push({"curl": tg.curl, "status": resp.statusCode, "error": resp.raw})
      }
    })
    if (errs.length) return new Error(`errors: ${JSON.stringify(errs)}`)
    return null
  } catch (err) {
    return err
  }
}
