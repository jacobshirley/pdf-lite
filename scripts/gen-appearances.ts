import { PdfDocument } from '../packages/pdf-lite/src'
import * as fs from 'fs'

const pdf =
    '/Users/jakeshirley/Documents/GitHub/svat-api/products/templates/src/vlegacy/templates/197/CA GST - Authorisation TEMPLATE new.pdf'

const pdfDoc = await PdfDocument.fromBytes([fs.readFileSync(pdf)], {
    incremental: true,
})

const acroform = pdfDoc.acroform
if (!acroform) {
    throw new Error('missing acroform')
}

acroform.importData({
    'form1[0]': '',
    'form1[0].#pageSet[0]': '',
    'form1[0].#pageSet[0].Master[0]': '',
    'form1[0].#pageSet[0].Master[0].ClearData_EN[0]': '',
    'form1[0].#pageSet[0].Master[1]': '',
    'form1[0].#pageSet[0].Master[1].ClearData_EN[0]': '',
    'form1[0].#pageSet[0].Master[2]': '',
    'form1[0].#pageSet[0].Master[2].ClearData_EN[0]': '',
    'form1[0].#pageSet[0].Master[3]': '',
    'form1[0].#pageSet[0].Master[3].ClearData_EN[0]': '',
    'form1[0].Page1[0]': '',
    'form1[0].Page1[0].P1_sf[0]': '',
    'form1[0].Page1[0].P1_sf[0].P1_BN_grp[0]': '',
    'form1[0].Page1[0].P1_sf[0].P1_BN_grp[0].P1_BN[0]': '',
    'form1[0].Page1[0].P1_sf[0].P1_Bsnss_Access[0]': '0',
    'form1[0].Page1[0].P1_sf[0].P1_bsnss_nm[0]': 'Test company 2222',
    'form1[0].Page1[0].P1_sf[0].P1_frst_nm[0]': '',
    'form1[0].Page1[0].P1_sf[0].P1_lst_nm[0]': '',
    'form1[0].Page1[0].P1_sf[0].P1_NonRes[0]': '',
    'form1[0].Page1[0].P1_sf[0].P1_NonRes[0].P1_NonRes_fill[0]': '',
    'form1[0].Page1[0].P1_sf[0].P1_NonRes[0].P1_NonRes_NR[0]': 'NR',
    'form1[0].Page1[0].P1_sf[0].P1_NR_nm[0]': '',
    'form1[0].Page1[0].P1_sf[0].P1_SIN[0]': '',
    'form1[0].Page1[0].P1_sf[0].P1_SIN[0].SIN[0]': '',
    'form1[0].Page1[0].P1_sf[0].P1_Table[0]': '',
    'form1[0].Page1[0].P1_sf[0].P1_Table[0].Row1[0]': '',
    'form1[0].Page1[0].P1_sf[0].P1_Table[0].Row1[0].cell1[0]': '',
    'form1[0].Page1[0].P1_sf[0].P1_Table[0].Row1[0].cell1[0].Prgrm_ID_bx[0]':
        '',
    'form1[0].Page1[0].P1_sf[0].P1_Table[0].Row1[0].cell2[0]': '',
    'form1[0].Page1[0].P1_sf[0].P1_Table[0].Row1[0].cell2[0].RefNmbr_chkbx[0]':
        '',
    'form1[0].Page1[0].P1_sf[0].P1_Table[0].Row1[0].cell2[0].RefNmbr_grp[0]':
        '',
    'form1[0].Page1[0].P1_sf[0].P1_Table[0].Row1[0].cell2[0].RefNmbr_grp[0].RefNmbr_dgt[0]':
        '',
    'form1[0].Page1[0].P1_sf[0].P1_Table[0].Row2[0]': '',
    'form1[0].Page1[0].P1_sf[0].P1_Table[0].Row2[0].cell1[0]': '',
    'form1[0].Page1[0].P1_sf[0].P1_Table[0].Row2[0].cell1[0].Prgrm_ID_bx[0]':
        '',
    'form1[0].Page1[0].P1_sf[0].P1_Table[0].Row2[0].cell2[0]': '',
    'form1[0].Page1[0].P1_sf[0].P1_Table[0].Row2[0].cell2[0].RefNmbr_chkbx[0]':
        '',
    'form1[0].Page1[0].P1_sf[0].P1_Table[0].Row2[0].cell2[0].RefNmbr_grp[0]':
        '',
    'form1[0].Page1[0].P1_sf[0].P1_Table[0].Row2[0].cell2[0].RefNmbr_grp[0].RefNmbr_dgt[0]':
        '',
    'form1[0].Page1[0].P1_sf[0].P1_trst_nm[0]': '',
    'form1[0].Page1[0].P1_sf[0].P1_TrustAccNum[0]': '',
    'form1[0].Page1[0].P1_sf[0].P1_TrustAccNum[0].P1_TrustAccNum_T[0]': 'T',
    'form1[0].Page1[0].P1_sf[0].P1_TrustAccNum[0].P1_TrustAccNum[0]': '',
    'form1[0].Page1[0].P2_sf[0]': '',
    'form1[0].Page1[0].P2_sf[0].P1_frm_nm[0]':
        'Borderfree Trade Limited trading as SimplyVAT.com',
    'form1[0].Page1[0].P2_sf[0].P2_frst_nm[0]': '',
    'form1[0].Page1[0].P2_sf[0].P2_lst_nm[0]': '',
    'form1[0].Page1[0].P2_sf[0].P3_phn1[0]': '',
    'form1[0].Page1[0].P2_sf[0].P3_phn2[0]': '00-44-127-363-4594',
    'form1[0].Page1[0].P2_sf[0].P3_phnext1[0]': '',
    'form1[0].Page1[0].P2_sf[0].P3_phnext2[0]': '',
    'form1[0].Page1[0].P2_sf[0].Part2_option1[0]': '',
    'form1[0].Page1[0].P2_sf[0].Part2_option1[1]': '2',
    'form1[0].Page2[0]': '',
    'form1[0].Page2[0].P3_sf[0]': '',
    'form1[0].Page2[0].P3_sf[0].Part3_option1[0]': '',
    'form1[0].Page2[0].P3_sf[0].Part3_option1[1]': '2',
    'form1[0].Page2[0].P4_sf[0]': '',
    'form1[0].Page2[0].P4_sf[0].P4_date[0]': '',
    'form1[0].Page2[0].P4_sf[0].P4_date[0].P4_Date_fill[0]': '',
    'form1[0].Page2[0].P5_sf[0]': '',
    'form1[0].Page2[0].P5_sf[0].P3_opt1_rb[0]': '',
    'form1[0].Page2[0].P5_sf[0].P3_opt2_rb[0]': '1',
    'form1[0].Page2[0].P5_sf[0].P5_address[0]': '',
    'form1[0].Page2[0].P5_sf[0].P5_city[0]': '',
    'form1[0].Page2[0].P5_sf[0].P5_country[0]': '',
    'form1[0].Page2[0].P5_sf[0].P5_Date_sf[0]': '',
    'form1[0].Page2[0].P5_sf[0].P5_Date_sf[0].P5_Date_fill[0]': '20000101',
    'form1[0].Page2[0].P5_sf[0].P5_frst_nm[0]': 'Jake',
    'form1[0].Page2[0].P5_sf[0].P5_lst_nm[0]': 'Shirley',
    'form1[0].Page2[0].P5_sf[0].P5_phn[0]': '',
    'form1[0].Page2[0].P5_sf[0].P5_prov[0]': '',
    'form1[0].Page2[0].P5_sf[0].P5_pstl_cd[0]': '',
})

await pdfDoc.finalize()

fs.writeFileSync('./output.pdf', pdfDoc.toBytes())
