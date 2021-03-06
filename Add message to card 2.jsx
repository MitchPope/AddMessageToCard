
// Choose file to open
if (isOSX())
{
    var cardFile = File.openDialog('Select a Card File', function (f) { return (f instanceof Folder) || f.name.match(/\.ai$/i);} );
} else
{
    var cardFile = File.openDialog('Select a Card File',);
}

// Choose save folder
if (isOSX())
{
    var saveFolder = Folder.selectDialog('Select a location to save the print files');
} else
{
    var saveFolder = Folder.selectDialog('Select a location to save the print files');
}

// Open in and read csv file
if (isOSX())
{
    var csvFile = File.openDialog('Select a TSV File', function (f) { return (f instanceof Folder) || f.name.match(/\.tsv$/i);} );
} else
{
    var csvFile = File.openDialog('Select a TSV File','tab-separated-values(*.tsv):*.tsv;');
}
if (csvFile != null)
{
    fileArray = readInCSV(csvFile);
}

function readInCSV(fileObj)
{
  var fileArray = new Array();
  fileObj.open('r');
  fileObj.seek(0, 0);
  var lineNum = 0;
  var lineBr = 'lineBr';
  while(!fileObj.eof)
  {
    var thisLine = fileObj.readln();
    var csvArray = thisLine;
    if (lineNum != 0 && lineNum !== ""){
      var re = /[0-9]/;
      if (csvArray.search(re) > 1 || csvArray.search(re) == -1){
        var lastIndex = fileArray.length-1;
        fileArray[lastIndex] = fileArray[lastIndex].concat(lineBr.concat(csvArray));
      } else {
        fileArray.push(csvArray);
      }
    } else {
      fileArray.push(csvArray);
    }
    lineNum++;
  }
  fileObj.close();
  return fileArray;
}

function isOSX()
{
    return $.os.match(/Macintosh/i);
}

// Main Loop //
clearLog()
for(i = 1; i < fileArray.length; i++){


    var XMLTemplate = '<?xml version="1.0" encoding="utf-8"?> \
    <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" [ \
        <!ENTITY ns_flows "http://ns.adobe.com/Flows/1.0/"> \
        <!ENTITY ns_extend "http://ns.adobe.com/Extensibility/1.0/"> \
        <!ENTITY ns_graphs "http://ns.adobe.com/Graphs/1.0/"> \
        <!ENTITY ns_vars "http://ns.adobe.com/Variables/1.0/"> \
        <!ENTITY ns_custom "http://ns.adobe.com/GenericCustomNamespace/1.0/"> \
        <!ENTITY ns_flows "http://ns.adobe.com/Flows/1.0/"> \
        <!ENTITY ns_svg "http://www.w3.org/2000/svg"> \
        <!ENTITY ns_ai "http://ns.adobe.com/AdobeIllustrator/10.0/"> \
        <!ENTITY ns_sfw "http://ns.adobe.com/SaveForWeb/1.0/"> \
        <!ENTITY ns_adobe_xpath "http://ns.adobe.com/XPath/1.0/"> \
        <!ENTITY ns_imrep "http://ns.adobe.com/ImageReplacement/1.0/"> \
    ]> \
    <svg version="1.1" \
         xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:a="http://ns.adobe.com/AdobeSVGViewerExtensions/3.0/" \
         x="0px" y="0px" width="0px" height="0px" viewBox="0 0 0 0" style="overflow:visible;" xml:space="preserve"> \
    <variableSets  xmlns="&ns_vars;"> \
        <variableSet  locked="none" varSetName="binding1"> \
            <variables> \
                <variable  category="&ns_flows;" trait="textcontent" varName="Message"></variable> \
                <variable  category="&ns_flows;" trait="textcontent" varName="Name"></variable> \
                <variable  category="&ns_flows;" trait="textcontent" varName="From"></variable> \
            </variables> \
            <v:sampleDataSets  xmlns="http://ns.adobe.com/GenericCustomNamespace/1.0/" xmlns:v="http://ns.adobe.com/Variables/1.0/">';

    var XMLTemplateEnd = '</v:sampleDataSets></variableSet></variableSets></svg>';
    
    var tsvArray = fileArray[i].split('\t');
    for(ii=0; ii<tsvArray.length; ii++){
        if (tsvArray[ii] === ""){
            tsvArray[ii] = "";
        } else {
            var tsvArrayUnsafe = tsvArray[ii].replace(/^"(.+(?="$))"$/, '$1');
            tsvArray[ii] = escapeXml(tsvArrayUnsafe);
            tsvArray[ii] = tsvArray[ii].replace(/['"“”‘’„”’]/g, '&#39;') 
        }
    }

    // Make specific XML file
        var XMLPath = writeXML(tsvArray);
    // Open Card File
    try{
        openFile(cardFile);
    }
    catch(e){
        //if(e){logErr(e)};
        logErr('Error on line ' + e.line + " - Error importing xml file: " + XMLPath); 
    }
    try{
        importXMLVariable(XMLPath,tsvArray[0]); 
    }
    catch(e){
        //if(e){logErr(e)};
        logErr('Error on line ' + e.line + " - Error importing xml file: " + XMLPath); 
        if (e == "MRAP"){
          alert(e);
          throw e;
        }
    }
    DealWithOversetText_MultiLine();
    deleteEmptyTextboxes();
    centerTextBoxes();
    SaveFilledFile(tsvArray[0]);
    app.activeDocument.close( SaveOptions.DONOTSAVECHANGES );
};


function writeXML(data){
    // Creates the XML //
    var filePath = saveFolder + '/' + data[0] + ".xml";
    var a = new File(filePath);
    a.open('w');
    a.writeln(XMLTemplate);
    a.writeln('<v:sampleDataSet dataSetName="' + data[0] + '">');
    a.writeln('<Name><p>' + data[1] + '</p></Name>');
    a.writeln('<Message><p>' + data[2] + '</p></Message>');
    a.writeln('<From><p>' + data[3] + '</p></From>');
    a.write('</v:sampleDataSet>');
    a.writeln(XMLTemplateEnd);
    a.close();
    return filePath;
};

function openFile(path){
    myDoc = app.open(path);
};

function importXMLVariable(XMLPath,setName){
    var XMLImport = new File(XMLPath);
    doc = app.activeDocument;
    try{
        doc.importVariables(XMLImport);
    } catch(e) {
        alert("Error importing variables" + e)
        logErr("Error importing variables" + e);
    }

    try{
        doc.activeDataset = app.activeDocument.dataSets.getByName(setName);
    } catch(e) {
        //alert("Error making setName: "+setName+", acting Dataset" + e)
        logErr("Error making setName acting Dataset" + e); 
    }
    
    try {
        doc.activeDataset.display();
    } catch(e) {
        //alert("Error displaying the active dataset" + e)
        logErr("Error displaying the active dataset" + e); 
    }
};

function logErr(error){
    try{
        var logPath = saveFolder + "/logerr.txt";
        var a = new File(logPath);
        //WRITE TO LOG
        a.open('a');
        try{
            a.writeln(error);
        } catch(e) {
            alert('cant writeln')
        }
        a.close();
    } catch(e) {
        alert('error logging to logerr file' + e);
    }
    return logPath;
}

function clearLog(){
    var filePath = saveFolder + "/logerr.txt";
    var a = new File(filePath);
    //CLEAR LOG
    try{
        a.open('w');
        a.writeln("");
        a.close();
    }
    catch(e){
        
    }

}

function SaveFilledFile(setName){
    var f = new Folder(saveFolder + '/Output');

    if (!f.exists){f.create();}
    
    var targetFile = new File(saveFolder + '/Output/' + setName + '.pdf');
    pdfSaveOpts = getPDFOptions();
    app.activeDocument.saveAs(targetFile, pdfSaveOpts);
}

function getPDFOptions()
{
   var pdfSaveOpts = new PDFSaveOptions();
   pdfSaveOpts.acrobatLayers = false;
   pdfSaveOpts.colorBars = false;
   pdfSaveOpts.colorCompression = CompressionQuality.AUTOMATICJPEGHIGH;
   pdfSaveOpts.compressArt = true;
   pdfSaveOpts.embedICCProfile = true;
   pdfSaveOpts.enablePlainText = true;
   pdfSaveOpts.generateThumbnails = false;
   pdfSaveOpts.optimization = true;
   pdfSaveOpts.pageInformation = false;
   return pdfSaveOpts;
}

function DealWithOversetText_MultiLine() {
  var defaultSizeTagName = "overset_text_default_size";
  var defaultIncrement = 0.2;

  function recordFontSizeInTag(size, art){
    var tag;
    var tags = art.tags;
    try {
      tag = tags.getByName(defaultSizeTagName);
      tag.value = size;
    } catch(e) {
      tag = tags.add();
      tag.name = defaultSizeTagName;
      tag.value = size;
    }
  };

  function readFontSizeFromTag(art){
    var tag;
    var tags = art.tags;
    try {
      tag = tags.getByName(defaultSizeTagName);
      return tag.value * 1;
    } catch(e) {
      return null;
    }
  };

  function recordFontSize() {
    var doc = app.activeDocument;
    for (var i = 0; i < doc.textFrames.length; i++) {
      var t = doc.textFrames[i];
      if ((t.kind == TextType.AREATEXT || t.kind == TextType.PATHTEXT) && t.editable && !t.locked && !t.hidden) {
        // t.note = t.textRange.characterAttributes.size;
        recordFontSizeInTag(t.textRange.characterAttributes.size, t);
      }
    };
  };

  function isOverset(textBox, lineAmt) {
    if (textBox.lines.length > 0) {
      var charactersOnVisibleLines = 0;
      //alert(lineAmt);
      /* if(typeof(lineAmt) != "undefined"){
        lineAmt = 1;
      } */
      for (var i = 0; i < lineAmt; i++) {
        charactersOnVisibleLines += textBox.lines[i].characters.length;
        //alert(textBox.lines[i].contents);
        if(textBox.lines[i].contents.search(/$/) > 0){charactersOnVisibleLines++};
        //alert(charactersOnVisibleLines + " on line " + i + " so far.\n" + lineAmt + "lines in total.")
      }
      //alert(charactersOnVisibleLines +"<"+ textBox.characters.length)
      if (charactersOnVisibleLines < textBox.characters.length) {
        return true;
      } else {
        return false;
      }
    } else if (textBox.characters.length > 0) {
      return true;
    }
  };

  function lineCount(textBox){
      return textBox.lines.length;
  }

  function shrinkFont(textBox) {
    //var lineCount = textBox.lines.length;
    if (textBox.lines.length > 0) {
      if (isOverset(textBox, lineCount(textBox))) {
        var inc = defaultIncrement;
        while (isOverset(textBox, lineCount(textBox))) {
          textBox.textRange.characterAttributes.size -= inc;
        }
      }
    } else if (textBox.characters.length > 0) {
      var inc = defaultIncrement;
      while (isOverset(textBox, lineCount(textBox))) {
        textBox.textRange.characterAttributes.size -= inc;
      }
    }
  };

  function resetSize(textAreaBox) {
    var t = textAreaBox;
    if (t.contents != "") {
      // if (t.note != "") {
      //     t.textRange.characterAttributes.size = (t.note * 1);
      // }
      var size = readFontSizeFromTag(t);
      if(size != null){
        t.textRange.characterAttributes.size = size;
      }
    }
  };

  function removeTagsOnText(){
    var doc = app.activeDocument;
    for (var i = 0; i < doc.textFrames.length; i++) {
      try {
        doc.textFrames[i].tags.getByName(defaultSizeTagName).remove();
      } catch (e) {

      }
    }
  };

  function resetAllTextBoxes() {
    for (var i = 0; i < doc.textFrames.length; i++) {
      var t = doc.textFrames[i];
      if ((t.kind == TextType.AREATEXT || t.kind == TextType.PATHTEXT) && t.editable && !t.locked && !t.hidden) {
        resetSize(t);
      }
    };
  };

  function shrinkAllTextBoxes() {
    for (var i = 0; i < doc.textFrames.length; i++) {
      var t = doc.textFrames[i];
      if ((t.kind == TextType.AREATEXT || t.kind == TextType.PATHTEXT) && t.editable && !t.locked && !t.hidden) {
        shrinkFont(t);
      }
    };
  };
  if (app.documents.length > 0) {
    var doc = app.activeDocument;
    /* if (doc.dataSets.length > 0 && doc.activeDataSet == doc.dataSets[0]) {
      recordFontSize();
    }
    resetAllTextBoxes(); */
    shrinkAllTextBoxes();
    /* if (doc.dataSets.length > 0 && doc.activeDataSet == doc.dataSets[doc.dataSets.length - 1]) {
      removeTagsOnText();
    } */
  }
  return true;
};

function deleteEmptyTextboxes(){
    var doc = app.activeDocument;
    for (var i = 0; i < doc.textFrames.length; i++) {
        var t = doc.textFrames[i];
        if (t.editable && !t.locked && !t.hidden) {
            var charCount = t.characters.length;
            if (charCount == 0){
                t.locked = true;
            }
        }
    };
};

function centerTextBoxes(){
    var doc = app.activeDocument;
    for (var i = 0; i < doc.textFrames.length; i++) {
        var t = doc.textFrames[i];
        if ((t.kind == TextType.AREATEXT || t.kind == TextType.PATHTEXT) && t.editable && !t.locked && !t.hidden) {
            t.convertAreaObjectToPointObject();
        }
    };
    app.executeMenuCommand('selectall');
    app.executeMenuCommand('group');
    // Get the active Artboard index
    var activeAB = doc.artboards[doc.artboards.getActiveArtboardIndex()];

    // Get the Height of the Artboard
    var artboardBottom = activeAB.artboardRect[3];

    doc.selection[0].top = (artboardBottom/2) + (doc.selection[0].height/2);
}

function escapeXml(unsafe) {
    return unsafe.replace(/&/g, '&amp;')
    .replace(/u2019/g, '&#39;')
    .replace(/lineBr/g, '&#10;')
    .replace(/[\r\n]|\r|\n/g, 'FUCKERFUCKSAKESWHYISA CARRIAGE RETURN A SPECIAL CHARACTER')
    .replace(/u2018/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/é/g, '&#233;')
    .replace(/!/g, '&#33;')
    .replace(/"/g, '&#34;') 
    .replace(/['"“”‘’„”’]/g, '&#39;') 
    .replace(/\./g, '&#46;') 
    .replace(/\?/g, '&#63;') 
    .replace(/@/g, '&#64;') 
    .replace(/_/g, '&#95;') 
    .replace(/`/g, '&#96;') 
    .replace(/~/g, '&#126;') 
    .replace(/€/g, '&#128;') 
    .replace(/¡/g, '&#161;') 
    .replace(/¢/g, '&#162;') 
    .replace(/£/g, '&#163;') 
    .replace(/¤/g, '&#164;') 
    .replace(/¥/g, '&#165;') 
    .replace(/¦/g, '&#166;') 
    .replace(/§/g, '&#167;') 
    .replace(/¨/g, '&#168;') 
    .replace(/©/g, '&#169;') 
    .replace(/ª/g, '&#170;') 
    .replace(/«/g, '&#171;') 
    .replace(/¬/g, '&#172;') 
    .replace(/­/g, '&#173;') 
    .replace(/®/g, '&#174;') 
    .replace(/¯/g, '&#175;') 
    .replace(/°/g, '&#176;') 
    .replace(/±/g, '&#177;') 
    .replace(/²/g, '&#178;') 
    .replace(/³/g, '&#179;') 
    .replace(/'/g, '&#180;') 
    .replace(/µ/g, '&#181;') 
    .replace(/¶/g, '&#182;') 
    .replace(/·/g, '&#183;') 
    .replace(/ç/g, '&#184;') 
    .replace(/¹/g, '&#185;') 
    .replace(/º/g, '&#186;') 
    .replace(/»/g, '&#187;') 
    .replace(/¼/g, '&#188;') 
    .replace(/½/g, '&#189;') 
    .replace(/¾/g, '&#190;') 
    .replace(/¿/g, '&#191;') 
    .replace(/ď/g, '&#271;') 
    .replace(/Đ/g, '&#272;') 
    .replace(/đ/g, '&#273;') 
    .replace(/Ē/g, '&#274;') 
    .replace(/ē/g, '&#275;') 
    .replace(/Ĕ/g, '&#276;') 
    .replace(/ĕ/g, '&#277;') 
    .replace(/Ė/g, '&#278;') 
    .replace(/ė/g, '&#279;') 
    .replace(/Ę/g, '&#280;') 
    .replace(/ę/g, '&#281;') 
    .replace(/Ě/g, '&#282;') 
    .replace(/ě/g, '&#283;') 
    .replace(/Ĝ/g, '&#284;') 
    .replace(/ĝ/g, '&#285;') 
    .replace(/Ğ/g, '&#286;') 
    .replace(/ğ/g, '&#287;') 
    .replace(/Ġ/g, '&#288;') 
    .replace(/ġ/g, '&#289;') 
    .replace(/Ģ/g, '&#290;') 
    .replace(/ģ/g, '&#291;') 
    .replace(/Ĥ/g, '&#292;') 
    .replace(/ĥ/g, '&#293;') 
    .replace(/Ħ/g, '&#294;') 
    .replace(/ħ/g, '&#295;') 
    .replace(/Ĩ/g, '&#296;') 
    .replace(/ĩ/g, '&#297;') 
    .replace(/Ī/g, '&#298;') 
    .replace(/ī/g, '&#299;') 
    .replace(/Ĭ/g, '&#300;') 
    .replace(/ĭ/g, '&#301;') 
    .replace(/Į/g, '&#302;') 
    .replace(/į/g, '&#303;') 
    .replace(/İ/g, '&#304;') 
    .replace(/ı/g, '&#305;') 
    .replace(/Ĳ/g, '&#306;') 
    .replace(/ĳ/g, '&#307;') 
    .replace(/Ĵ/g, '&#308;') 
    .replace(/ĵ/g, '&#309;') 
    .replace(/Ķ/g, '&#310;') 
    .replace(/ķ/g, '&#311;') 
    .replace(/ĸ/g, '&#312;') 
    .replace(/Ĺ/g, '&#313;') 
    .replace(/ĺ/g, '&#314;') 
    .replace(/Ļ/g, '&#315;') 
    .replace(/ļ/g, '&#316;') 
    .replace(/Ľ/g, '&#317;') 
    .replace(/ľ/g, '&#318;') 
    .replace(/Ŀ/g, '&#319;') 
    .replace(/ŀ/g, '&#320;') 
    .replace(/Ł/g, '&#321;') 
    .replace(/ł/g, '&#322;') 
    .replace(/Ń/g, '&#323;') 
    .replace(/ń/g, '&#324;') 
    .replace(/Ņ/g, '&#325;') 
    .replace(/ņ/g, '&#326;') 
    .replace(/Ň/g, '&#327;') 
    .replace(/ň/g, '&#328;') 
    .replace(/ŉ/g, '&#329;') 
    .replace(/Ĭ/g, '&#330;') 
    .replace(/ŋ/g, '&#331;') 
    .replace(/Ō/g, '&#332;') 
    .replace(/ō/g, '&#333;') 
    .replace(/Ŏ/g, '&#334;') 
    .replace(/ŏ/g, '&#335;') 
    .replace(/Ő/g, '&#336;') 
    .replace(/ő/g, '&#337;') 
    .replace(/Œ/g, '&#338;') 
    .replace(/œ/g, '&#339;') 
    .replace(/Ŕ/g, '&#340;') 
    .replace(/ŕ/g, '&#341;') 
    .replace(/Ŗ/g, '&#342;') 
    .replace(/ŗ/g, '&#343;') 
    .replace(/Ř/g, '&#344;') 
    .replace(/ř/g, '&#345;') 
    .replace(/Ś/g, '&#346;') 
    .replace(/ś/g, '&#347;') 
    .replace(/Ŝ/g, '&#348;') 
    .replace(/ŝ/g, '&#349;') 
    .replace(/À/g, '&#192;') 
    .replace(/Á/g, '&#193;') 
    .replace(/Â/g, '&#194;') 
    .replace(/Ã/g, '&#195;') 
    .replace(/Å/g, '&#196;') 
    .replace(/Ä/g, '&#197;') 
    .replace(/Æ/g, '&#198;') 
    .replace(/Ç/g, '&#199;') 
    .replace(/È/g, '&#200;') 
    .replace(/É/g, '&#201;') 
    .replace(/Ê/g, '&#202;') 
    .replace(/Ë/g, '&#203;') 
    .replace(/Ì/g, '&#204;') 
    .replace(/Í/g, '&#205;') 
    .replace(/Î/g, '&#206;') 
    .replace(/Ï/g, '&#207;') 
    .replace(/Ð/g, '&#208;') 
    .replace(/Ñ/g, '&#209;') 
    .replace(/Ò/g, '&#210;') 
    .replace(/Ó/g, '&#211;') 
    .replace(/Ô/g, '&#212;') 
    .replace(/Õ/g, '&#213;') 
    .replace(/Ö/g, '&#214;') 
    .replace(/×/g, '&#215;') 
    .replace(/Ø/g, '&#216;') 
    .replace(/Ù/g, '&#217;') 
    .replace(/Ú/g, '&#218;') 
    .replace(/Û/g, '&#219;') 
    .replace(/Ü/g, '&#220;') 
    .replace(/Ý/g, '&#221;') 
    .replace(/Þ/g, '&#222;') 
    .replace(/ß/g, '&#223;') 
    .replace(/à/g, '&#224;') 
    .replace(/á/g, '&#225;') 
    .replace(/â/g, '&#226;') 
    .replace(/ã/g, '&#227;') 
    .replace(/ä/g, '&#228;') 
    .replace(/å/g, '&#229;') 
    .replace(/æ/g, '&#230;') 
    .replace(/ç/g, '&#231;') 
    .replace(/è/g, '&#232;') 
    .replace(/é/g, '&#233;') 
    .replace(/ê/g, '&#234;') 
    .replace(/ë/g, '&#235;') 
    .replace(/ì/g, '&#236;') 
    .replace(/í/g, '&#237;') 
    .replace(/î/g, '&#238;') 
    .replace(/ï/g, '&#239;') 
    .replace(/ð/g, '&#240;') 
    .replace(/ñ/g, '&#241;') 
    .replace(/ò/g, '&#242;') 
    .replace(/ó/g, '&#243;') 
    .replace(/ô/g, '&#244;') 
    .replace(/õ/g, '&#245;') 
    .replace(/ö/g, '&#246;') 
    .replace(/÷/g, '&#247;') 
    .replace(/ø/g, '&#248;') 
    .replace(/ù/g, '&#249;') 
    .replace(/ú/g, '&#250;') 
    .replace(/û/g, '&#251;') 
    .replace(/ü/g, '&#252;') 
    .replace(/ý/g, '&#253;') 
    .replace(/þ/g, '&#254;') 
    .replace(/ÿ/g, '&#255;') 
    .replace(/Ā/g, '&#256;') 
    .replace(/ā/g, '&#257;') 
    .replace(/Ă/g, '&#258;') 
    .replace(/ă/g, '&#259;') 
    .replace(/Ą/g, '&#260;') 
    .replace(/ą/g, '&#261;') 
    .replace(/Ć/g, '&#262;') 
    .replace(/ć/g, '&#263;') 
    .replace(/Ĉ/g, '&#264;') 
    .replace(/ĉ/g, '&#265;') 
    .replace(/Ċ/g, '&#266;') 
    .replace(/ċ/g, '&#267;') 
    .replace(/Č/g, '&#268;') 
    .replace(/č/g, '&#269;') 
    .replace(/Ş/g, '&#350;') 
    .replace(/Ť/g, '&#356;') 
    .replace(/ť/g, '&#357;') 
    .replace(/Ŧ/g, '&#358;') 
    .replace(/ŧ/g, '&#359;') 
    .replace(/Ũ/g, '&#360;') 
    .replace(/ũ/g, '&#361;') 
    .replace(/Ū/g, '&#362;') 
    .replace(/ū/g, '&#363;') 
    .replace(/Ŭ/g, '&#364;') 
    .replace(/ŭ/g, '&#365;') 
    .replace(/Ů/g, '&#366;') 
    .replace(/ů/g, '&#367;') 
    .replace(/Ű/g, '&#368;') 
    .replace(/ű/g, '&#369;') 
    .replace(/Ų/g, '&#370;') 
    .replace(/ų/g, '&#371;') 
    .replace(/Ŵ/g, '&#372;') 
    .replace(/ŵ/g, '&#373;') 
    .replace(/Ŷ/g, '&#374;') 
    .replace(/ŷ/g, '&#375;') 
    .replace(/Ÿ/g, '&#376;') 
    .replace(/Ź/g, '&#377;') 
    .replace(/ź/g, '&#378;') 
    .replace(/Ż/g, '&#379;') 
    .replace(/ż/g, '&#380;') 
    .replace(/Ž/g, '&#381;') 
    .replace(/ž/g, '&#382;') 
    .replace(/ſ/g, '&#383;') 
    .replace(/ƀ/g, '&#384;') 
    .replace(/Ɓ/g, '&#385;') 
    .replace(/Ƃ/g, '&#386;') 
    .replace(/ƃ/g, '&#387;') 
    .replace(/Ƅ/g, '&#388;') 
    .replace(/ƅ/g, '&#389;') 
    .replace(/Ɔ/g, '&#390;') 
    .replace(/Ƈ/g, '&#391;') 
    .replace(/ƈ/g, '&#392;') 
    .replace(/Ɖ/g, '&#393;') 
    .replace(/Ɗ/g, '&#394;') 
    .replace(/Ƌ/g, '&#395;') 
    .replace(/ƌ/g, '&#396;') 
    .replace(/ƍ/g, '&#397;') 
    .replace(/Ǝ/g, '&#398;') 
    .replace(/Ə/g, '&#399;') 
    .replace(/Ɛ/g, '&#400;') 
    .replace(/Ƒ/g, '&#401;') 
    .replace(/ƒ/g, '&#402;') 
    .replace(/Ɠ/g, '&#403;') 
    .replace(/Ɣ/g, '&#404;') 
    .replace(/ƕ/g, '&#405;') 
    .replace(/Ɩ/g, '&#406;') 
    .replace(/Ɨ/g, '&#407;') 
    .replace(/Ƙ/g, '&#408;') 
    .replace(/ƙ/g, '&#409;') 
    .replace(/ƚ/g, '&#410;') 
    .replace(/ƛ/g, '&#411;') 
    .replace(/Ɯ/g, '&#412;') 
    .replace(/Ɲ/g, '&#413;') 
    .replace(/ƞ/g, '&#414;') 
    .replace(/Ɵ/g, '&#415;') 
    .replace(/Ơ/g, '&#416;') 
    .replace(/ơ/g, '&#417;') 
    .replace(/Ƣ/g, '&#418;') 
    .replace(/ƣ/g, '&#419;') 
    .replace(/Ƥ/g, '&#420;') 
    .replace(/ƥ/g, '&#421;') 
    .replace(/Ʀ/g, '&#422;') 
    .replace(/Ƨ/g, '&#423;') 
    .replace(/ƨ/g, '&#424;') 
    .replace(/Ʃ/g, '&#425;') 
    .replace(/Ǵ/g, '&#500;') 
    .replace(/ɘ/g, '&#600;');
}
/* 
Regex to delete comments:
/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.+
 */
/* function escapeXml(unsafe) {
  var safe = "";
  safe = unsafe.replace(/&/g, '&amp;')
  safe = safe.replace(/u2019/g, '&#39;')
  safe = safe.replace(/lineBr/g, '&#10;')
  safe = safe.replace(/[\r\n]|\r|\n/g, 'FUCKER')
  safe = safe.replace(/u2018/g, '&#39;')
  safe = safe.replace(/</g, '&lt;')
  safe = safe.replace(/>/g, '&gt;')
  safe = safe.replace(/"/g, '&quot;')
  safe = safe.replace(/'/g, '&apos;')
  safe = safe.replace(/é/g, '&#233;')
  safe = safe.replace(/!/g, '&#33;')
  safe = safe.replace(/"/g, '&#34;')  //   Quotation mark "
  //safe = safe.replace(/#/g, '&#35;')  //   Number sign #
  //safe = safe.replace(/$/g, '&#36;')  //   Dollar sign $
  //safe = safe.replace(/%/g, '&#37;')  //   Percent sign %
  safe = safe.replace(/['"“”‘’„”’]/g, '&#39;')  //   Apostrophe '
  //safe = safe.replace(/(/g, '&#40;')  //   Left parenthesis (
  //safe = safe.replace(/\)/g, '&#41;')  //   Right parenthesis ) 
  //safe = safe.replace(/+/g, '&#43;')  //   Plus sign +
  //safe = safe.replace(/,/g, '&#44;')  //   Comma ,
  //safe = safe.replace(/-/g, '&#45;')  //   Hyphen -
  safe = safe.replace(/\./g, '&#46;')  //   Period (fullstop) . 
  //safe = safe.replace(/:/g, '&#58;')  //   Colon :
  //safe = safe.replace(/;/g, '&#59;')  //   Semi-colon  ;
  //safe = safe.replace(/</g, '&#60;')  //   Less than <
  //safe = safe.replace(/>/g, '&#62;')  //   Greater than >
  safe = safe.replace(/\?/g, '&#63;')  //   Question mark ? 
  safe = safe.replace(/@/g, '&#64;')  //   Commercial at @
  //safe = safe.replace(/^/g, '&#94;')  //   Caret ^
  safe = safe.replace(/_/g, '&#95;')  //   Horizontal bar _
  safe = safe.replace(/`/g, '&#96;')  //   grave accent ` 
  //safe = safe.replace(/{/g, '&#123;')  //  Left curly brace {
  //safe = safe.replace(/|/g, '&#124;')  //  Vertical bar |
  //safe = safe.replace(/}/g, '&#125;')  //  Right curly brace }
  safe = safe.replace(/~/g, '&#126;')  //  Tilde ~
  safe = safe.replace(/€/g, '&#128;')  //  Euro €
  safe = safe.replace(/¡/g, '&#161;')  // Inverted exclamation ¡
  safe = safe.replace(/¢/g, '&#162;')  // Cent sign ¢
  safe = safe.replace(/£/g, '&#163;')  // Pound sterling £
  safe = safe.replace(/¤/g, '&#164;')  // General currency sign ¤
  safe = safe.replace(/¥/g, '&#165;')  // Yen sign ¥
  safe = safe.replace(/¦/g, '&#166;')  // Broken vertical bar ¦
  safe = safe.replace(/§/g, '&#167;')  // Section sign §
  safe = safe.replace(/¨/g, '&#168;')  // Umlaut (dieresis) ¨
  safe = safe.replace(/©/g, '&#169;')  // Copyright ©
  safe = safe.replace(/ª/g, '&#170;')  // Feminine ordinal ª
  safe = safe.replace(/«/g, '&#171;')  // Left angle quote, guillemotleft «
  safe = safe.replace(/¬/g, '&#172;')  // Not sign ¬
  safe = safe.replace(/­/g, '&#173;')  // Soft hyphen ­
  safe = safe.replace(/®/g, '&#174;')  // Registered trademark ®
  safe = safe.replace(/¯/g, '&#175;')  // Macron accent ¯ 
  safe = safe.replace(/°/g, '&#176;')  // Degree sign °
  safe = safe.replace(/±/g, '&#177;')  // Plus or minus ±
  safe = safe.replace(/²/g, '&#178;')  // Superscript two ²
  safe = safe.replace(/³/g, '&#179;')  // Superscript three ³
  safe = safe.replace(/'/g, '&#180;')  // Acute accent '
  safe = safe.replace(/µ/g, '&#181;')  // Micro sign µ
  safe = safe.replace(/¶/g, '&#182;')  // Paragraph sign ¶
  safe = safe.replace(/·/g, '&#183;')  // Middle dot · 
  safe = safe.replace(/ç/g, '&#184;')  // Cedilla ¸ (as in ç)
  safe = safe.replace(/¹/g, '&#185;')  // Superscript one ¹
  safe = safe.replace(/º/g, '&#186;')  // Masculine ordinal º
  safe = safe.replace(/»/g, '&#187;')  // Right angle quote, guillemotright »
  safe = safe.replace(/¼/g, '&#188;')  // Fraction one-fourth ¼
  safe = safe.replace(/½/g, '&#189;')  // Fraction one-half ½
  safe = safe.replace(/¾/g, '&#190;')  // Fraction three-fourths ¾
  safe = safe.replace(/¿/g, '&#191;')  // Inverted question mark ¿
  safe = safe.replace(/ď/g, '&#271;')  //ď
  safe = safe.replace(/Đ/g, '&#272;')  //Đ
  safe = safe.replace(/đ/g, '&#273;')  //đ
  safe = safe.replace(/Ē/g, '&#274;')  //Ē
  safe = safe.replace(/ē/g, '&#275;')  //ē - macron
  safe = safe.replace(/Ĕ/g, '&#276;')  //Ĕ
  safe = safe.replace(/ĕ/g, '&#277;')  //ĕ
  safe = safe.replace(/Ė/g, '&#278;')  //Ė
  safe = safe.replace(/ė/g, '&#279;')  //ė
  safe = safe.replace(/Ę/g, '&#280;')  //Ę
  safe = safe.replace(/ę/g, '&#281;')  //ę
  safe = safe.replace(/Ě/g, '&#282;')  //Ě
  safe = safe.replace(/ě/g, '&#283;')  //ě
  safe = safe.replace(/Ĝ/g, '&#284;')  //Ĝ
  safe = safe.replace(/ĝ/g, '&#285;')  //ĝ
  safe = safe.replace(/Ğ/g, '&#286;')  //Ğ
  safe = safe.replace(/ğ/g, '&#287;')  //ğ
  safe = safe.replace(/Ġ/g, '&#288;')  //Ġ
  safe = safe.replace(/ġ/g, '&#289;')  //ġ
  safe = safe.replace(/Ģ/g, '&#290;')  //Ģ
  safe = safe.replace(/ģ/g, '&#291;')  //ģ
  safe = safe.replace(/Ĥ/g, '&#292;')  //Ĥ
  safe = safe.replace(/ĥ/g, '&#293;')  //ĥ
  safe = safe.replace(/Ħ/g, '&#294;')  //Ħ
  safe = safe.replace(/ħ/g, '&#295;')  //ħ
  safe = safe.replace(/Ĩ/g, '&#296;')  //Ĩ
  safe = safe.replace(/ĩ/g, '&#297;')  //ĩ
  safe = safe.replace(/Ī/g, '&#298;')  //Ī
  safe = safe.replace(/ī/g, '&#299;')  //ī
  safe = safe.replace(/Ĭ/g, '&#300;')  //Ĭ
  safe = safe.replace(/ĭ/g, '&#301;')  //ĭ
  safe = safe.replace(/Į/g, '&#302;')  //Į
  safe = safe.replace(/į/g, '&#303;')  //į
  safe = safe.replace(/İ/g, '&#304;')  //İ
  safe = safe.replace(/ı/g, '&#305;')  //ı
  safe = safe.replace(/Ĳ/g, '&#306;')  // Ĳ
  safe = safe.replace(/ĳ/g, '&#307;')  //ĳ
  safe = safe.replace(/Ĵ/g, '&#308;')  //Ĵ
  safe = safe.replace(/ĵ/g, '&#309;')  //ĵ
  safe = safe.replace(/Ķ/g, '&#310;')  //Ķ
  safe = safe.replace(/ķ/g, '&#311;')  //ķ
  safe = safe.replace(/ĸ/g, '&#312;')  //ĸ
  safe = safe.replace(/Ĺ/g, '&#313;')  //Ĺ
  safe = safe.replace(/ĺ/g, '&#314;')  //ĺ
  safe = safe.replace(/Ļ/g, '&#315;')  //Ļ
  safe = safe.replace(/ļ/g, '&#316;')  //ļ
  safe = safe.replace(/Ľ/g, '&#317;')  //Ľ
  safe = safe.replace(/ľ/g, '&#318;')  //ľ
  safe = safe.replace(/Ŀ/g, '&#319;')  //Ŀ
  safe = safe.replace(/ŀ/g, '&#320;')  //ŀ
  safe = safe.replace(/Ł/g, '&#321;')  //Ł
  safe = safe.replace(/ł/g, '&#322;')  //ł
  safe = safe.replace(/Ń/g, '&#323;')  //Ń
  safe = safe.replace(/ń/g, '&#324;')  //ń
  safe = safe.replace(/Ņ/g, '&#325;')  //Ņ
  safe = safe.replace(/ņ/g, '&#326;')  //ņ
  safe = safe.replace(/Ň/g, '&#327;')  //Ň
  safe = safe.replace(/ň/g, '&#328;')  //ň
  safe = safe.replace(/ŉ/g, '&#329;')  //ŉ
  safe = safe.replace(/Ĭ/g, '&#330;')  //Ĭ
  safe = safe.replace(/ŋ/g, '&#331;')  // ŋ
  safe = safe.replace(/Ō/g, '&#332;')  //Ō
  safe = safe.replace(/ō/g, '&#333;')  //ō
  safe = safe.replace(/Ŏ/g, '&#334;')  //Ŏ
  safe = safe.replace(/ŏ/g, '&#335;')  //ŏ
  safe = safe.replace(/Ő/g, '&#336;')  //Ő
  safe = safe.replace(/ő/g, '&#337;')  //ő
  safe = safe.replace(/Œ/g, '&#338;')  //Œ
  safe = safe.replace(/œ/g, '&#339;')  //œ
  safe = safe.replace(/Ŕ/g, '&#340;')  //Ŕ
  safe = safe.replace(/ŕ/g, '&#341;')  //ŕ
  safe = safe.replace(/Ŗ/g, '&#342;')  //Ŗ
  safe = safe.replace(/ŗ/g, '&#343;')  //ŗ
  safe = safe.replace(/Ř/g, '&#344;')  //Ř
  safe = safe.replace(/ř/g, '&#345;')  //ř
  safe = safe.replace(/Ś/g, '&#346;')  //Ś
  safe = safe.replace(/ś/g, '&#347;')  //ś
  safe = safe.replace(/Ŝ/g, '&#348;')  //Ŝ
  safe = safe.replace(/ŝ/g, '&#349;')  //ŝ 
  safe = safe.replace(/À/g, '&#192;')  // Capital A, grave accent À
  safe = safe.replace(/Á/g, '&#193;')  // Capital A, acute accent Á
  safe = safe.replace(/Â/g, '&#194;')  // Capital A, circumflex accent Â
  safe = safe.replace(/Ã/g, '&#195;')  // Capital A, tilde Ã
  safe = safe.replace(/Å/g, '&#196;')  // Capital A, ring Å
  safe = safe.replace(/Ä/g, '&#197;')  // Capital A, dieresis or umlaut mark Ä
  safe = safe.replace(/Æ/g, '&#198;')  // Capital AE dipthong (ligature) Æ
  safe = safe.replace(/Ç/g, '&#199;')  // Capital C, cedilla Ç
  safe = safe.replace(/È/g, '&#200;')  // Capital E, grave accent È
  safe = safe.replace(/É/g, '&#201;')  // Capital E, acute accent É
  safe = safe.replace(/Ê/g, '&#202;')  // Capital E, circumflex accent Ê
  safe = safe.replace(/Ë/g, '&#203;')  // Capital E, dieresis or umlaut mark Ë
  safe = safe.replace(/Ì/g, '&#204;')  // Capital I, grave accent Ì
  safe = safe.replace(/Í/g, '&#205;')  // Capital I, acute accent Í
  safe = safe.replace(/Î/g, '&#206;')  // Capital I, circumflex accent Î
  safe = safe.replace(/Ï/g, '&#207;')  // Capital I, dieresis or umlaut mark Ï
  safe = safe.replace(/Ð/g, '&#208;')  // Capital Eth, Icelandic Ð
  safe = safe.replace(/Ñ/g, '&#209;')  // Capital N, tilde Ñ
  safe = safe.replace(/Ò/g, '&#210;')  // Capital O, grave accent Ò
  safe = safe.replace(/Ó/g, '&#211;')  // Capital O, acute accent Ó
  safe = safe.replace(/Ô/g, '&#212;')  // Capital O, circumflex accent Ô
  safe = safe.replace(/Õ/g, '&#213;')  // Capital O, tilde Õ
  safe = safe.replace(/Ö/g, '&#214;')  // Capital O, dieresis or umlaut mark Ö
  safe = safe.replace(/×/g, '&#215;')  // Multiply symbol ×
  safe = safe.replace(/Ø/g, '&#216;')  // Capital O, slash Ø
  safe = safe.replace(/Ù/g, '&#217;')  // Capital U, grave accent Ù
  safe = safe.replace(/Ú/g, '&#218;')  // Capital U, acute accent Ú
  safe = safe.replace(/Û/g, '&#219;')  // Capital U, circumflex accent Û
  safe = safe.replace(/Ü/g, '&#220;')  // Capital U, dieresis or umlaut mark Ü
  safe = safe.replace(/Ý/g, '&#221;')  // Capital Y, acute accent Ý
  safe = safe.replace(/Þ/g, '&#222;')  // Capital THORN, Icelandic Þ 
  safe = safe.replace(/ß/g, '&#223;')  // Small sharp s, German (sz ligature) ß 
  safe = safe.replace(/à/g, '&#224;')  // Small a, grave accent à
  safe = safe.replace(/á/g, '&#225;')  // Small a, acute accent á
  safe = safe.replace(/â/g, '&#226;')  // Small a, circumflex accent â
  safe = safe.replace(/ã/g, '&#227;')  // Small a, tilde ã
  safe = safe.replace(/ä/g, '&#228;')  // Small a, dieresis or umlaut mark ä
  safe = safe.replace(/å/g, '&#229;')  // Small a, ring å
  safe = safe.replace(/æ/g, '&#230;')  // Small ae dipthong (ligature) æ
  safe = safe.replace(/ç/g, '&#231;')  // Small c, cedilla ç
  safe = safe.replace(/è/g, '&#232;')  // Small e, grave accent è
  safe = safe.replace(/é/g, '&#233;')  // Small e, acute accent é
  safe = safe.replace(/ê/g, '&#234;')  // Small e, circumflex accent ê
  safe = safe.replace(/ë/g, '&#235;')  // Small e, dieresis or umlaut mark ë
  safe = safe.replace(/ì/g, '&#236;')  // Small i, grave accent ì
  safe = safe.replace(/í/g, '&#237;')  // Small i, acute accent í
  safe = safe.replace(/î/g, '&#238;')  // Small i, circumflex accent î
  safe = safe.replace(/ï/g, '&#239;')  // Small i, dieresis or umlaut mark ï
  safe = safe.replace(/ð/g, '&#240;')  // Small eth, Icelandic ð
  safe = safe.replace(/ñ/g, '&#241;')  // Small n, tilde ñ
  safe = safe.replace(/ò/g, '&#242;')  // Small o, grave accent ò
  safe = safe.replace(/ó/g, '&#243;')  // Small o, acute accent ó
  safe = safe.replace(/ô/g, '&#244;')  // Small o, circumflex accent ô
  safe = safe.replace(/õ/g, '&#245;')  // Small o, tilde õ
  safe = safe.replace(/ö/g, '&#246;')  // Small o, dieresis or umlaut mark ö
  safe = safe.replace(/÷/g, '&#247;')  // Division sign ÷
  safe = safe.replace(/ø/g, '&#248;')  // Small o, slash ø
  safe = safe.replace(/ù/g, '&#249;')  // Small u, grave accent ù 
  safe = safe.replace(/ú/g, '&#250;')  // Small u, acute accent ú
  safe = safe.replace(/û/g, '&#251;')  // Small u, circumflex accent û
  safe = safe.replace(/ü/g, '&#252;')  // Small u, dieresis or umlaut mark ü
  safe = safe.replace(/ý/g, '&#253;')  // Small y, acute accent ý
  safe = safe.replace(/þ/g, '&#254;')  // Small thorn, Icelandic þ
  safe = safe.replace(/ÿ/g, '&#255;')  // Small y, dieresis or umlaut mark ÿ
  safe = safe.replace(/Ā/g, '&#256;')  //Ā
  safe = safe.replace(/ā/g, '&#257;')  //ā
  safe = safe.replace(/Ă/g, '&#258;')  //Ă
  safe = safe.replace(/ă/g, '&#259;')  //ă
  safe = safe.replace(/Ą/g, '&#260;')  //Ą
  safe = safe.replace(/ą/g, '&#261;')  //ą
  safe = safe.replace(/Ć/g, '&#262;')  //Ć
  safe = safe.replace(/ć/g, '&#263;')  //ć
  safe = safe.replace(/Ĉ/g, '&#264;')  //Ĉ
  safe = safe.replace(/ĉ/g, '&#265;')  //ĉ
  safe = safe.replace(/Ċ/g, '&#266;')  //Ċ
  safe = safe.replace(/ċ/g, '&#267;')  //ċ
  safe = safe.replace(/Č/g, '&#268;')  //Č
  safe = safe.replace(/č/g, '&#269;')  //č - háček
  safe = safe.replace(/Ş/g, '&#350;')  //Ş
  safe = safe.replace(/Ť/g, '&#356;')  // Ť
  safe = safe.replace(/ť/g, '&#357;')  //ť
  safe = safe.replace(/Ŧ/g, '&#358;')  //Ŧ
  safe = safe.replace(/ŧ/g, '&#359;')  //ŧ
  safe = safe.replace(/Ũ/g, '&#360;')  //Ũ
  safe = safe.replace(/ũ/g, '&#361;')  //ũ
  safe = safe.replace(/Ū/g, '&#362;')  //Ū
  safe = safe.replace(/ū/g, '&#363;')  //ū
  safe = safe.replace(/Ŭ/g, '&#364;')  //Ŭ
  safe = safe.replace(/ŭ/g, '&#365;')  //ŭ - crescent
  safe = safe.replace(/Ů/g, '&#366;')  //Ů
  safe = safe.replace(/ů/g, '&#367;')  //ů
  safe = safe.replace(/Ű/g, '&#368;')  //Ű
  safe = safe.replace(/ű/g, '&#369;')  //ű
  safe = safe.replace(/Ų/g, '&#370;')  //Ų
  safe = safe.replace(/ų/g, '&#371;')  //ų
  safe = safe.replace(/Ŵ/g, '&#372;')  //Ŵ
  safe = safe.replace(/ŵ/g, '&#373;')  //ŵ
  safe = safe.replace(/Ŷ/g, '&#374;')  //Ŷ
  safe = safe.replace(/ŷ/g, '&#375;')  //ŷ
  safe = safe.replace(/Ÿ/g, '&#376;')  //Ÿ
  safe = safe.replace(/Ź/g, '&#377;')  //Ź
  safe = safe.replace(/ź/g, '&#378;')  //ź
  safe = safe.replace(/Ż/g, '&#379;')  //Ż
  safe = safe.replace(/ż/g, '&#380;')  //ż
  safe = safe.replace(/Ž/g, '&#381;')  //Ž
  safe = safe.replace(/ž/g, '&#382;')  //ž
  safe = safe.replace(/ſ/g, '&#383;')  //ſ
  safe = safe.replace(/ƀ/g, '&#384;')  //ƀ
  safe = safe.replace(/Ɓ/g, '&#385;')  //Ɓ
  safe = safe.replace(/Ƃ/g, '&#386;')  //Ƃ
  safe = safe.replace(/ƃ/g, '&#387;')  //ƃ
  safe = safe.replace(/Ƅ/g, '&#388;')  //Ƅ
  safe = safe.replace(/ƅ/g, '&#389;')  //ƅ
  safe = safe.replace(/Ɔ/g, '&#390;')  //Ɔ
  safe = safe.replace(/Ƈ/g, '&#391;')  //Ƈ
  safe = safe.replace(/ƈ/g, '&#392;')  //ƈ
  safe = safe.replace(/Ɖ/g, '&#393;')  //Ɖ
  safe = safe.replace(/Ɗ/g, '&#394;')  //Ɗ
  safe = safe.replace(/Ƌ/g, '&#395;')  //Ƌ
  safe = safe.replace(/ƌ/g, '&#396;')  //ƌ
  safe = safe.replace(/ƍ/g, '&#397;')  //ƍ
  safe = safe.replace(/Ǝ/g, '&#398;')  //Ǝ
  safe = safe.replace(/Ə/g, '&#399;')  //Ə
  safe = safe.replace(/Ɛ/g, '&#400;')  //Ɛ
  safe = safe.replace(/Ƒ/g, '&#401;')  //Ƒ
  safe = safe.replace(/ƒ/g, '&#402;')  //ƒ
  safe = safe.replace(/Ɠ/g, '&#403;')  //Ɠ
  safe = safe.replace(/Ɣ/g, '&#404;')  //Ɣ
  safe = safe.replace(/ƕ/g, '&#405;')  //ƕ
  safe = safe.replace(/Ɩ/g, '&#406;')  //Ɩ
  safe = safe.replace(/Ɨ/g, '&#407;')  //Ɨ
  safe = safe.replace(/Ƙ/g, '&#408;')  //Ƙ
  safe = safe.replace(/ƙ/g, '&#409;')  //ƙ
  safe = safe.replace(/ƚ/g, '&#410;')  //ƚ
  safe = safe.replace(/ƛ/g, '&#411;')  //ƛ
  safe = safe.replace(/Ɯ/g, '&#412;')  //Ɯ
  safe = safe.replace(/Ɲ/g, '&#413;')  //Ɲ
  safe = safe.replace(/ƞ/g, '&#414;')  //ƞ
  safe = safe.replace(/Ɵ/g, '&#415;')  //Ɵ
  safe = safe.replace(/Ơ/g, '&#416;')  //Ơ
  safe = safe.replace(/ơ/g, '&#417;')  //ơ
  safe = safe.replace(/Ƣ/g, '&#418;')  //Ƣ
  safe = safe.replace(/ƣ/g, '&#419;')  //ƣ
  safe = safe.replace(/Ƥ/g, '&#420;')  //Ƥ
  safe = safe.replace(/ƥ/g, '&#421;')  //ƥ
  safe = safe.replace(/Ʀ/g, '&#422;')  //Ʀ
  safe = safe.replace(/Ƨ/g, '&#423;')  //Ƨ
  safe = safe.replace(/ƨ/g, '&#424;')  //ƨ
  safe = safe.replace(/Ʃ/g, '&#425;')  //Ʃ
  safe = safe.replace(/Ǵ/g, '&#500;')  //Ǵ
  safe = safe.replace(/ɘ/g, '&#600;');  //ɘ 
  alert(safe);
  return safe;
} */