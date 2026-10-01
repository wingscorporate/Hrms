import { jsPDF } from 'jspdf';
import { Employee, PayrollRecord, CompanySettings } from '../types';

export function formatINR(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(val);
}

export function generatePayslipPDF(
  employee: Employee,
  payroll: PayrollRecord,
  company: CompanySettings
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header Background Bar
  doc.setFillColor(29, 43, 69); // #1D2B45 Primary Navy
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Company Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(company.companyName.toUpperCase(), margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(200, 215, 240);
  doc.text(company.tagline, margin, 17);
  doc.text(company.address, margin, 22);

  // Payslip Month Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('PAYSLIP / SALARY CERTIFICATE', pageWidth - margin, 13, { align: 'right' });
  doc.setFontSize(9);
  doc.setTextColor(245, 158, 11); // Gold accent
  const monthName = new Date(payroll.monthYear + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  doc.text(`Period: ${monthName.toUpperCase()}`, pageWidth - margin, 19, { align: 'right' });

  // Employee Information Box
  let y = 35;
  doc.setFillColor(245, 247, 250);
  doc.rect(margin, y, pageWidth - margin * 2, 34, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, pageWidth - margin * 2, 34, 'S');

  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);

  // Left Column
  doc.text('Employee Name:', margin + 4, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(employee.fullName, margin + 35, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.text('Employee ID:', margin + 4, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(employee.employeeCode, margin + 35, y + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('Designation:', margin + 4, y + 21);
  doc.setFont('helvetica', 'normal');
  doc.text(employee.designation, margin + 35, y + 21);

  doc.setFont('helvetica', 'bold');
  doc.text('Joining Date:', margin + 4, y + 28);
  doc.setFont('helvetica', 'normal');
  doc.text(employee.joiningDate, margin + 35, y + 28);

  // Right Column
  const rightX = pageWidth / 2 + 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Bank Name:', rightX, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(employee.bankDetails.bankName, rightX + 32, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.text('Account No:', rightX, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(employee.bankDetails.accountNumber, rightX + 32, y + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('PAN Number:', rightX, y + 21);
  doc.setFont('helvetica', 'normal');
  doc.text(employee.pan || employee.bankDetails?.panNumber || 'N/A', rightX + 32, y + 21);

  doc.setFont('helvetica', 'bold');
  doc.text('UAN Number:', rightX, y + 28);
  doc.setFont('helvetica', 'normal');
  doc.text(employee.uan || 'N/A', rightX + 32, y + 28);

  // Earnings & Deductions Tables Side-by-Side
  y = 76;
  const colWidth = (pageWidth - margin * 2 - 6) / 2;
  const leftColX = margin;
  const rightColX = margin + colWidth + 6;

  // Earnings Header
  doc.setFillColor(54, 92, 245); // #365CF5 Secondary Blue
  doc.rect(leftColX, y, colWidth, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('EARNINGS', leftColX + 4, y + 5.5);
  doc.text('AMOUNT (INR)', leftColX + colWidth - 4, y + 5.5, { align: 'right' });

  // Deductions Header
  doc.setFillColor(220, 38, 38); // Red
  doc.rect(rightColX, y, colWidth, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text('DEDUCTIONS', rightColX + 4, y + 5.5);
  doc.text('AMOUNT (INR)', rightColX + colWidth - 4, y + 5.5, { align: 'right' });

  y += 8;

  const earningsList = [
    { label: 'Basic Salary', amount: payroll.basicSalary },
    { label: 'House Rent Allowance (HRA)', amount: payroll.hra },
    { label: 'Special & Other Allowances', amount: payroll.allowances },
    { label: 'Performance Incentives', amount: payroll.incentives },
    { label: 'Company Bonus', amount: payroll.bonus },
    { label: 'Overtime Compensation', amount: payroll.overtime },
  ];

  const deductionsList = [
    { label: 'Provident Fund (Employee PF)', amount: payroll.pf },
    { label: 'Employee State Insurance (ESI)', amount: payroll.esi },
    { label: 'Professional Tax (PT)', amount: payroll.professionalTax },
    { label: 'Income Tax Deduction (TDS)', amount: payroll.tds },
    { label: 'Late Attendance Penalty', amount: payroll.lateDeduction },
    { label: 'Leave Without Pay (LWP)', amount: payroll.leaveWithoutPay },
    { label: 'Advance / Other Deductions', amount: payroll.otherDeduction },
  ];

  const maxRows = Math.max(earningsList.length, deductionsList.length);
  const rowHeight = 7.5;

  doc.setFontSize(8.5);

  for (let i = 0; i < maxRows; i++) {
    const rowY = y + i * rowHeight;
    const isEven = i % 2 === 0;

    // Row backgrounds
    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(leftColX, rowY, colWidth, rowHeight, 'F');
      doc.rect(rightColX, rowY, colWidth, rowHeight, 'F');
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(leftColX, rowY + rowHeight, leftColX + colWidth, rowY + rowHeight);
    doc.line(rightColX, rowY + rowHeight, rightColX + colWidth, rowY + rowHeight);

    // Earnings cell
    if (earningsList[i]) {
      doc.setTextColor(51, 65, 85);
      doc.setFont('helvetica', 'normal');
      doc.text(earningsList[i].label, leftColX + 4, rowY + 5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(formatINR(earningsList[i].amount), leftColX + colWidth - 4, rowY + 5, { align: 'right' });
    }

    // Deductions cell
    if (deductionsList[i]) {
      doc.setTextColor(51, 65, 85);
      doc.setFont('helvetica', 'normal');
      doc.text(deductionsList[i].label, rightColX + 4, rowY + 5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(formatINR(deductionsList[i].amount), rightColX + colWidth - 4, rowY + 5, { align: 'right' });
    }
  }

  y += maxRows * rowHeight;

  // Subtotal Rows
  doc.setFillColor(238, 242, 255);
  doc.rect(leftColX, y, colWidth, 9, 'F');
  doc.setTextColor(30, 58, 138);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TOTAL GROSS EARNINGS', leftColX + 4, y + 6);
  doc.text(`Rs. ${formatINR(payroll.grossSalary)}`, leftColX + colWidth - 4, y + 6, { align: 'right' });

  doc.setFillColor(254, 242, 242);
  doc.rect(rightColX, y, colWidth, 9, 'F');
  doc.setTextColor(153, 27, 27);
  doc.text('TOTAL DEDUCTIONS', rightColX + 4, y + 6);
  doc.text(`Rs. ${formatINR(payroll.totalDeductions)}`, rightColX + colWidth - 4, y + 6, { align: 'right' });

  y += 15;

  // Net Salary Callout Box
  doc.setFillColor(29, 43, 69);
  doc.rect(margin, y, pageWidth - margin * 2, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('NET SALARY PAYABLE:', margin + 6, y + 12);

  doc.setFontSize(14);
  doc.setTextColor(34, 197, 94); // Emerald Green
  doc.text(`INR ${formatINR(payroll.netSalary)}`, pageWidth - margin - 6, y + 12, { align: 'right' });

  y += 28;

  // Payment Status & Statutory Note
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`Payment Status: ${payroll.status.toUpperCase()}  |  Mode: ${payroll.paymentMode || 'Direct Bank NEFT'}  |  Disbursement Date: ${payroll.paymentDate || '2026-09-30'}`, margin, y);
  doc.text('Tax Deducted at Source (TDS) as per Indian Income Tax Act 1961 provisions. Retain this payslip for tax returns filing.', margin, y + 5);

  // Signatory & Stamp Box
  y += 20;
  const sigX = pageWidth - margin - 65;
  doc.setDrawColor(203, 213, 225);
  doc.line(sigX, y + 18, sigX + 65, y + 18);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(29, 43, 69);
  doc.text('Authorized by Wings Corporation', sigX + 32, y + 23, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Human Resources & Payroll Division', sigX + 32, y + 27, { align: 'center' });

  // Footer Disclaimer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('This is a verified computer-generated document issued by Wings HRMS. No physical signature is required.', pageWidth / 2, pageHeight - 8, { align: 'center' });

  doc.save(`Wings_Payslip_${employee.employeeCode}_${payroll.monthYear}.pdf`);
}
