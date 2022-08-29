import * as xlsx from "xlsx"

// eslint-disable-next-line import/no-anonymous-default-export
export default async function (data:any,sheetName:string,fileName:string) {
  const workSheet = await xlsx.utils.json_to_sheet(data);
  const workbook = await xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, workSheet, sheetName);
  // xlsx.write(workbook,{bookType:'xlsx',type:'buffer'})
  await xlsx.writeFile(workbook, fileName+".xlsx");
}
