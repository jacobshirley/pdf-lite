import { PdfDocument } from '../packages/pdf-lite/src'
import * as fs from 'fs'

const pdf =
    '/Users/jakeshirley/Documents/GitHub/svat-api/products/templates/src/vlegacy/templates/165/IE Letter of Authority.pdf'

console.time('read')
const pdfDoc = await PdfDocument.fromBytes([fs.readFileSync(pdf)], {
    incremental: true,
})
console.timeEnd('read')

console.time('acroform')
const acroform = pdfDoc.acroform
if (!acroform) {
    throw new Error('missing acroform')
}
console.timeEnd('acroform')

console.time('import')
acroform.importData({
    accountingMonthly: 'Off',
    accountingThreemonths: 'On',
    accountingYearly: 'Off',
    appendedRegistration: 'On',
    branchRegistration: 'On',
    businessActivities:
        'Online sales of Whatever i want via Wherever i want. Distance sales threshold crossed/will be crossed on 11/10/2020 and held stock since/will hold stock from 01/01/2020',
    businessOps: 'Whatever i want',
    businessOps2: '',
    businessOps3: '',
    companyAddress: '28, Flat 3 Brunswick Road, Brighton, BN3 1DG, GB',
    companyForm: 'LTD',
    companyName: 'Test company',
    companyNumber: '34434',
    companyTelephone: '07479964173',
    directorName1: 'Jake Shirley',
    directorName2: '',
    directorName3: '',
    directorName4: ' ',
    directorName5: '',
    directorsName: 'Jake Shirley, Director',
    dirShare1: '',
    dirShare2: '',
    dirShare3: '',
    dirShare4: '',
    dirShare5: '',
    exportFromno: 'Off',
    exportFromyes: 'On',
    foreignRegdistance: 'Off',
    foreignRegnontax: 'Off',
    foreignRegrequired: 'Off',
    foreignRegvol: 'Off',
    ftaxApproval: 'On',
    goodsEucountry: 'On',
    goodsOtherplace: 'Off',
    goodsOutsideeu: 'On',
    goodsWarehouse: 'Off',
    officeAddress: '28, Flat 3 Brunswick Road, Brighton, BN3 1DG, GB',
    officeDescription: 'Business operations conducted from offices in GB',
    operationShare: '100%',
    operationShare2: '',
    operationShare3: '',
    operationsStartdate: '11/11/2019',
    payeAddress:
        "Test company, c/o Borderfree Trade Limited ta SimplyVAT.com - Unit J, Hove Technology Centre, St Joseph's Cl, Hove, BN3 7ES, UK.",
    poaOption: 'On',
    saleAgreements: 'Yeeeeeeeeeeeeeeeeeeee',
    saleMarketplace: 'Wherever i want',
    staffLocation: 'As above',
    staffLocation2: 'As above',
    svAddress:
        "Unit J, Hove Technology Centre, St Joseph's Cl, Hove, BN3 7ES, UK.",
    svmemberDetails: 'SimplyVAT.com, Onboarding Department',
    svmemberDetails2: 'SimplyVAT.com, Cient Manager',
    svmemberEmail: 'registration@simplyvat.com',
    svmemberEmail2: 'admin@simplyvat.com',
    svmemberName: 'Besi Dema',
    svmemberName2: '',
    svmemberTelephone: '+44 1273 634594',
    svmemberTelephone2: '+44 1273 634594',
    swedishAddress: 'n/a',
    swedishAddress2: 'n/a',
    swedishBranch: 'On',
    swedishEntnonbusiness: 'On',
    swedishEntnovat: 'Off',
    swedishEntvat: 'On',
    swedishOperations: 'On',
    swedishOperations2: 'On',
    swedishProperty: 'On',
    swedishRep: 'On',
    swedishVat: 'On',
    vatNumber: 'GB270200848',
    yearEnd: '31/12/2020',
    yearlySales: '2000',
})
console.timeEnd('import')

console.time('finalize')
await pdfDoc.finalize()
console.timeEnd('finalize')
fs.writeFileSync('output.pdf', pdfDoc.toBytes())
