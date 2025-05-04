import React, { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

type Message = {
  id: string;
  text: string;
  sender: "user" | "bot";
  isStreaming?: boolean;
};

const MyChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Hello, I am an AI assistant powered by Gemini. How can I help you today?",
      sender: "bot",
    },
  ]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [isApiKeySet, setIsApiKeySet] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const genAIRef = useRef<any>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle API key submission
  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApiKey(apiKeyInput);
    try {
      genAIRef.current = new GoogleGenerativeAI(apiKeyInput);
      setIsApiKeySet(true);
    } catch (error) {
      console.error("Error initializing Gemini:", error);
      alert(
        "Failed to initialize Gemini with the provided API key. Please check and try again."
      );
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: inputValue,
      sender: "user",
    };

    // Add bot temporary message
    const botMessageId = `bot-${Date.now()}`;
    const botMessage: Message = {
      id: botMessageId,
      text: "",
      sender: "bot",
      isStreaming: true,
    };

    setMessages((prevMessages) => [...prevMessages, userMessage, botMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      if (!genAIRef.current) {
        genAIRef.current = new GoogleGenerativeAI(apiKey);
      }

      const model = genAIRef.current.getGenerativeModel({
        model: "gemini-1.5-pro",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });

      const result = await model.generateContentStream({
        contents: [{ role: "user", parts: [{ text: userMessage.text }] }],
      });

      let fullText = "";

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;

        // Update bot message with streamed text
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === botMessageId ? { ...msg, text: fullText } : msg
          )
        );
      }

      // Mark message as no longer streaming
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === botMessageId ? { ...msg, isStreaming: false } : msg
        )
      );
    } catch (error) {
      console.error("Error generating content:", error);

      // Update bot message with error
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === botMessageId
            ? {
                ...msg,
                text: "Sorry, I encountered an error while generating a response. Please try again or check your API key.",
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Custom styles
  const styles = {
    container: {
      maxWidth: "600px",
      margin: "0 auto",
      border: "1px solid #ddd",
      borderRadius: "8px",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column" as const,
      height: "500px",
    },
    header: {
      backgroundColor: "#4285f4",
      color: "white",
      padding: "10px 15px",
      textAlign: "center" as const,
      fontWeight: "bold",
      fontSize: "16px",
    },
    messagesContainer: {
      flex: 1,
      overflow: "auto",
      padding: "15px",
      backgroundColor: "#f9f9f9",
      display: "flex",
      flexDirection: "column" as const,
    },
    message: {
      padding: "10px",
      borderRadius: "8px",
      marginBottom: "10px",
      maxWidth: "80%",
      wordBreak: "break-word" as const,
    },
    userMessage: {
      backgroundColor: "#dcf8c6",
      alignSelf: "flex-end" as const,
    },
    botMessage: {
      backgroundColor: "#e3f2fd",
      alignSelf: "flex-start" as const,
    },
    inputContainer: {
      display: "flex",
      padding: "10px",
      borderTop: "1px solid #ddd",
      backgroundColor: "#fff",
    },
    input: {
      flex: 1,
      padding: "10px",
      border: "1px solid #ddd",
      borderRadius: "4px",
      fontSize: "14px",
    },
    button: {
      padding: "10px 15px",
      marginLeft: "10px",
      backgroundColor: "#4285f4",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
    },
    typingIndicator: {
      display: "flex",
      padding: "5px 10px",
      borderRadius: "8px",
      backgroundColor: "#e3f2fd",
      alignSelf: "flex-start" as const,
      marginBottom: "10px",
    },
    dot: {
      width: "8px",
      height: "8px",
      backgroundColor: "#4285f4",
      borderRadius: "50%",
      margin: "0 2px",
      animation: "bounce 1.4s infinite ease-in-out",
      animationFillMode: "both" as const,
    },
    apiKeyForm: {
      display: "flex",
      flexDirection: "column" as const,
      padding: "20px",
      backgroundColor: "#f9f9f9",
      borderRadius: "8px",
      margin: "20px auto",
      maxWidth: "500px",
    },
    formTitle: {
      marginBottom: "15px",
      color: "#333",
      textAlign: "center" as const,
    },
    formInput: {
      padding: "10px",
      margin: "10px 0",
      border: "1px solid #ddd",
      borderRadius: "4px",
    },
    formButton: {
      padding: "10px 15px",
      backgroundColor: "#4285f4",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      marginTop: "10px",
    },
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <h1 style={{ textAlign: "center", color: "#4285f4" }}>
        Custom React Chatbot with Gemini AI
      </h1>

      {!isApiKeySet ? (
        <div style={styles.apiKeyForm}>
          <h2 style={styles.formTitle}>Enter your Gemini API Key</h2>
          <p>
            To use this chatbot, you need to provide your Gemini API key. You
            can get one from the{" "}
            <a
              href="https://ai.google.dev/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google AI Developer Portal
            </a>
            .
          </p>
          <form onSubmit={handleApiKeySubmit}>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Enter your API key"
              style={styles.formInput}
              required
            />
            <button type="submit" style={styles.formButton}>
              Set API Key
            </button>
          </form>
          <div style={{ marginTop: "15px", fontSize: "14px", color: "#666" }}>
            <p>
              <strong>Note:</strong> Make sure you're using a valid API key with
              access to the latest Gemini models.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={styles.container}>
            <div style={styles.header}>Gemini AI Chatbot</div>
            <div style={styles.messagesContainer}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    ...styles.message,
                    ...(message.sender === "user"
                      ? styles.userMessage
                      : styles.botMessage),
                  }}
                >
                  {message.text}
                  {message.isStreaming && (
                    <span style={{ marginLeft: "5px", opacity: 0.5 }}>▌</span>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} style={styles.inputContainer}>
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Type your message here..."
                style={styles.input}
                disabled={isLoading}
              />
              <button type="submit" style={styles.button} disabled={isLoading}>
                Send
              </button>
            </form>
          </div>

          <div
            style={{
              textAlign: "center",
              marginTop: "20px",
              fontSize: "12px",
              color: "#666",
            }}
          >
            <p>
              This chatbot is powered by Google's Gemini AI.
              <br />
              Your API key is stored locally and not sent to any server except
              Google's AI services.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyChatBot;
