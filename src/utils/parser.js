import { isChinese, isKana, isJapaneseOriginal } from './helpers';

// 智能分析表格列
function analyzeTableColumns(headers) {
  let chineseColIndex = -1;
  let originalColIndex = -1;
  let kanaColIndex = -1;
  let analysisDetails = [];
  
  // 1. 先通过表头文字判断
  headers.forEach((header, index) => {
    const lowerHeader = header.toLowerCase().trim();
    
    if (chineseColIndex === -1 && 
        (lowerHeader.includes('中文') || lowerHeader.includes('意思') || 
         lowerHeader.includes('汉语') || lowerHeader.includes('翻译'))) {
      chineseColIndex = index;
      analysisDetails.push(`通过表头"${header}"识别为中文意思列`);
    }
    
    if (originalColIndex === -1 && 
        (lowerHeader.includes('日文') || lowerHeader.includes('原文') ||
         lowerHeader.includes('日语') || lowerHeader.includes('日本語'))) {
      originalColIndex = index;
      analysisDetails.push(`通过表头"${header}"识别为日语原文列`);
    }
    
    if (kanaColIndex === -1 && 
        (lowerHeader.includes('假名') || lowerHeader.includes('kana') ||
         lowerHeader.includes('平假名') || lowerHeader.includes('片假名'))) {
      kanaColIndex = index;
      analysisDetails.push(`通过表头"${header}"识别为假名列`);
    }
  });
  
  // 2. 如果表头无法确定，尝试通过内容特征判断
  if (chineseColIndex === -1 || originalColIndex === -1 || kanaColIndex === -1) {
    analysisDetails.push("表头信息不足，尝试通过内容特征识别...");
  }
  
  return {
    chineseColIndex,
    originalColIndex,
    kanaColIndex,
    analysisDetails
  };
}

// 解析输入内容
export function parseInput(input) {
  const parsedList = [];
  const lines = input.trim().split('\n').filter(line => line.trim() !== '');
  let analysisDetails = [];
  
  // 检查是否为Markdown表格
  const hasMarkdownSeparator = lines.some(line => 
    line.trim().includes('| ----') || line.trim().includes('| ---')
  );
  
  if (hasMarkdownSeparator) {
    // 解析Markdown表格
    let headers = [];
    let isHeaderPassed = false;
    let columnAnalysis = { chineseColIndex: -1, originalColIndex: -1, kanaColIndex: -1 };
    
    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim();
      
      // 提取表头
      if (!isHeaderPassed && !trimmedLine.includes('| ----') && !trimmedLine.includes('| ---')) {
        if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
          headers = trimmedLine.slice(1, -1).split('|').map(cell => cell.trim());
        }
      }
      
      // 遇到分隔线，确定表头已处理
      if (trimmedLine.includes('| ----') || trimmedLine.includes('| ---')) {
        isHeaderPassed = true;
        columnAnalysis = analyzeTableColumns(headers);
        analysisDetails = [...columnAnalysis.analysisDetails];
        
        if (columnAnalysis.chineseColIndex === -1 || columnAnalysis.kanaColIndex === -1) {
          analysisDetails.push("警告：未能自动识别中文意思列或假名列，将尝试逐行分析");
        }
        return;
      }
      
      // 处理表格内容行
      if (isHeaderPassed && trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
        const cells = trimmedLine.slice(1, -1).split('|').map(cell => cell.trim());
        
        let chineseMeaning = '';
        let originalText = '';
        let kana = '';
        
        if (columnAnalysis.chineseColIndex !== -1 && columnAnalysis.kanaColIndex !== -1) {
          chineseMeaning = cells[columnAnalysis.chineseColIndex] || '';
          kana = cells[columnAnalysis.kanaColIndex] || '';
          if (columnAnalysis.originalColIndex !== -1) {
            originalText = cells[columnAnalysis.originalColIndex] || '';
          }
        } else {
          // 逐行分析
          cells.forEach(cell => {
            if (!chineseMeaning && isChinese(cell)) {
              chineseMeaning = cell;
            } else if (!originalText && isJapaneseOriginal(cell)) {
              originalText = cell;
            } else if (!kana && isKana(cell)) {
              kana = cell;
            }
          });
          
          // 兜底方案
          if (!chineseMeaning && cells.length > 0) {
            chineseMeaning = cells[0];
            analysisDetails.push(`第${lineIndex+1}行：默认第一列"${chineseMeaning}"为中文意思`);
          }
          if (!kana && cells.length > 1) {
            kana = cells[cells.length - 1];
            analysisDetails.push(`第${lineIndex+1}行：默认最后一列"${kana}"为假名`);
          }
          if (!originalText) {
            for (let i = 0; i < cells.length; i++) {
              if (i !== cells.indexOf(chineseMeaning) && i !== cells.indexOf(kana) && cells[i]) {
                originalText = cells[i];
                analysisDetails.push(`第${lineIndex+1}行：默认第${i+1}列"${originalText}"为日语原文`);
                break;
              }
            }
          }
        }
        
        if (chineseMeaning && kana) {
          parsedList.push({ 
            chinese: chineseMeaning, 
            original: originalText, 
            kana: kana 
          });
        }
      }
    });
  } else {
    // 解析文本格式
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        const parts = trimmedLine.split(',').map(part => part.trim());
        if (parts.length >= 2) {
          let chineseMeaning = '';
          let originalText = '';
          let kana = '';
          
          parts.forEach(part => {
            if (isChinese(part) && !chineseMeaning) {
              chineseMeaning = part;
            } else if (isJapaneseOriginal(part) && !originalText) {
              originalText = part;
            } else if (isKana(part) && !kana) {
              kana = part;
            }
          });
          
          // 兜底方案
          if (!chineseMeaning) chineseMeaning = parts[0];
          if (!kana) kana = parts[parts.length > 2 ? 2 : 1];
          if (!originalText && parts.length > 2 && parts[1] !== kana) {
            originalText = parts[1];
          }
          
          if (chineseMeaning && kana) {
            parsedList.push({ chinese: chineseMeaning, original: originalText, kana: kana });
          }
        }
      }
    });
    analysisDetails.push("使用文本格式解析，识别中文、日语原文和假名成功");
  }
  
  return { parsedList, analysisDetails };
}
