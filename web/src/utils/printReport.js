export function handlePrintReport(test, submission, sName, batchTitle) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to save or print the PDF report.');
    return;
  }

  // Detect image file submission
  const lowerName = (submission.submittedFileName || '').toLowerCase();
  const isImg = lowerName.endsWith('.png') || 
                lowerName.endsWith('.jpg') || 
                lowerName.endsWith('.jpeg') || 
                lowerName.endsWith('.webp') ||
                lowerName.endsWith('.gif') ||
                (submission.submittedFileURL && submission.submittedFileURL.includes('image'));
  
  const questionsHtml = test.testContent 
    ? `<div class="section">
         <h3>1. Test Questions Paper</h3>
         <pre style="white-space: pre-wrap; font-family: monospace; font-size: 13px; line-height: 1.5; background: #f9f9f9; padding: 15px; border-radius: 6px; border: 1px solid #ddd; color: #334155;">${test.testContent}</pre>
       </div>`
    : '';

  let answersHtml = '';
  if (submission.studentText || submission.submittedFileURL) {
    answersHtml = `
      <div class="section">
        <h3>2. Student's Answer Submission</h3>
        
        ${submission.studentText 
          ? `<div style="margin-bottom: 15px;">
               <strong style="font-size: 12px; color: #475569; display: block; margin-bottom: 5px;">Written Answers Text:</strong>
               <pre style="white-space: pre-wrap; font-family: monospace; font-size: 13px; line-height: 1.5; background: #f9f9f9; padding: 15px; border-radius: 6px; border: 1px solid #ddd; color: #334155; margin: 0;">${submission.studentText}</pre>
             </div>`
          : ''
        }

        ${submission.submittedFileURL
          ? (isImg 
              ? `<div style="margin-top: 15px;">
                   <strong style="font-size: 12px; color: #475569; display: block; margin-bottom: 5px;">Uploaded Work Image:</strong>
                   <div style="border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; background: #f8fafc; text-align: center;">
                     <img src="${submission.submittedFileURL}" style="max-width: 100%; max-height: 800px; border-radius: 6px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);" />
                   </div>
                 </div>`
              : `<div style="margin-top: 15px;">
                   <strong style="font-size: 12px; color: #475569; display: block; margin-bottom: 5px;">Uploaded Attachment File:</strong>
                   <p style="margin: 0; font-size: 13px;">File Name: <strong>${submission.submittedFileName || 'solution-file'}</strong></p>
                   <p style="margin: 5px 0 0 0; font-size: 12px; color: #d97706;"><em>(PDF/document files are attached to the digital classroom record. Open in dashboard to view.)</em></p>
                 </div>`
            )
          : ''
        }
      </div>
    `;
  }

  const feedbackHtml = submission.feedback
    ? `<div class="section">
         <h3>3. Teacher's Grade & Conversational Feedback</h3>
         <div style="background: #fffdf5; padding: 20px; border-radius: 8px; border: 1px solid #fef3c7; font-size: 14px; line-height: 1.7; color: #1e293b; white-space: pre-wrap; font-family: inherit; box-shadow: inset 0 2px 4px 0 rgb(0 0 0 / 0.02);"><b>Teacher Comments:</b>\n\n${submission.feedback}</div>
       </div>`
    : '';

  printWindow.document.write(`
    <html>
      <head>
        <title>SmartChalk Grade Report - ${test.title}</title>
        <style>
          body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            color: #333;
            line-height: 1.5;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: 800;
            color: #d97706; /* amber-600 */
            margin-bottom: 5px;
          }
          .title {
            font-size: 28px;
            font-weight: 700;
            margin: 10px 0 5px 0;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-top: 20px;
            background: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
          }
          .meta-item {
            font-size: 14px;
          }
          .meta-item strong {
            color: #111;
          }
          .section {
            margin-top: 30px;
            page-break-inside: avoid;
          }
          h3 {
            font-size: 18px;
            border-bottom: 1px solid #eee;
            padding-bottom: 8px;
            color: #111;
          }
          @media print {
            body { padding: 20px; }
            button { display: none; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">SmartChalk</div>
          <div style="font-size: 12px; text-transform: uppercase; color: #666; letter-spacing: 1px;">Academic Performance & Grade Report</div>
          <h1 class="title">${test.title}</h1>
          <p style="color: #666; margin: 0; font-size: 14px;">${test.description || ''}</p>
          
          <div class="meta-grid">
            <div class="meta-item">Student: <strong>${sName}</strong></div>
            <div class="meta-item">Subject/Batch: <strong>${batchTitle || ''}</strong></div>
            <div class="meta-item">Max Possible Score: <strong>${test.maxScore} marks</strong></div>
            <div class="meta-item">Graded Score: <strong style="color: #16a34a; font-size: 16px;">${submission.grade} / ${test.maxScore}</strong></div>
          </div>
        </div>

        ${questionsHtml}
        ${answersHtml}
        ${feedbackHtml}

        <div style="margin-top: 50px; text-align: center;">
          <button onclick="window.print()" style="background: #d97706; color: white; border: none; padding: 10px 20px; font-size: 14px; font-weight: bold; border-radius: 6px; cursor: pointer;">
            Save as PDF / Print Report
          </button>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
}
