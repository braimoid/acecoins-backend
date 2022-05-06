const moment = require('moment')

console.log("hi")

          let period = 2
          const investedAt = "09-28-2020"

          console.log( moment(investedAt).add(period, 'months').format('MM-DD-YYYY'))
          console.log(moment().format('MM-DD-YYYY'))

console.log(moment().format('MM-DD-YYYY') == moment(investedAt).add(period, 'months').format('MM-DD-YYYY'))