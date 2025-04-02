import React from "react";
import ReactMarkdown from "react-markdown";

interface FormattedMessageProps {
  content: string;
  enableMarkdown?: boolean;
}

const FormattedMessage: React.FC<FormattedMessageProps> = ({
  content,
  enableMarkdown = true,
}) => {
  if (!enableMarkdown) {
    return <div className="whitespace-pre-wrap">{content}</div>;
  }

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};

export default FormattedMessage;
