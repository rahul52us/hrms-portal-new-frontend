"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import "suneditor/dist/css/suneditor.min.css";
import { Box } from "@chakra-ui/react";
import "./style.css";
import { observer } from "mobx-react-lite";
import stores from "../../../store/stores";

// Dynamically import SunEditor
const SunEditorDynamic = dynamic(() => import("suneditor-react").then((mod) => mod.default), {
  ssr: false,
  loading: () => <p>Loading editor...</p>,
});

interface RichTextEditorProps {
  editorHtml: string;
  setEditorHtml?: any;
  height?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = observer(({
  editorHtml,
  setEditorHtml,
  height = "350px",
}) => {
  const { auth: { uploadFile } } = stores;
  const [isEditorReady, setIsEditorReady] = useState(false);
  const safeEditorHtml = editorHtml ?? "";

  useEffect(() => {
    setIsEditorReady(true);
  }, []);

  const handleImageUpload = async (file: File, uploadHandler: any) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onloadend = async () => {
      const base64String = reader.result as string;

      const imageData = {
        file: {
          filename: file.name,
          type: file.type,
          buffer: base64String,
        },
      };

      try {
        const dt = await uploadFile(imageData);
        const imageUrl = dt?.data;

        if (imageUrl) {
          uploadHandler({
            result: [{ url: imageUrl }],
          });
        } else {
          throw new Error("No URL returned from upload");
        }
      } catch ({}) {
        uploadHandler({
          result: []
        });
      }
    };
  };

  if (!isEditorReady) return <p>Loading editor...</p>;

  return (
    <Box>
      <SunEditorDynamic
        setContents={safeEditorHtml}
        onChange={(content: string) => setEditorHtml(content)}
        height={height} // Use prop height instead of hardcoded "60vh"
        setOptions={{
          buttonList: [
            ["undo", "redo"],
            ["font", "fontSize", "formatBlock"],
            ["bold", "italic", "underline", "strike", "subscript", "superscript"],
            ["align", "horizontalRule", "list", "lineHeight"],
            ["outdent", "indent"],
            ["table", "link", "image", "video", "audio"],
            ["blockquote", "codeView"],
            ["fontColor", "hiliteColor", "removeFormat"],
            ["fullScreen", "showBlocks", "preview"],
          ],
          resizingBar: true,
          font: [
            "Arial",
            "Courier New",
            "Georgia",
            "Times New Roman",
            "Trebuchet MS",
            "Verdana",
            "Comic Sans MS",
            "Roboto",
          ],
          fontSize: [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48],
          formats: ["p", "h1", "h2", "h3", "h4", "h5", "h6", "div", "pre"],
          imageFileInput: true,
          videoFileInput: true,
          audioFileInput: true,
          imageWidth: "auto",
          videoWidth: "640",
          audioWidth: "300",
          stickyToolbar: 0,
          minHeight: "200px",
          maxHeight: height,
          placeholder: "Start typing here...",
        }}
        onImageUploadBefore={(files, info, uploadHandler) => {
          handleImageUpload(files[0], uploadHandler);
          return false;
        }}
      />
    </Box>
  );
});

export default RichTextEditor;