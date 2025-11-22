import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI, Type, Schema } from "@google/genai";

// --- Types & Schemas ---

interface ToolkitData {
  childName: string;
  title: string;
  storyText: string;
  storyImageUrl?: string;
  visualStyle: string;
  questions: {
    type: "Who" | "What" | "Where" | "When";
    question: string;
    answer: string;
  }[];
  sequenceEvents: {
    id: string;
    order: number;
    text: string;
    imagePrompt: string;
    imageUrl?: string;
  }[];
  inference: {
    scenario: string;
    starter: string;
    reasonStarter: string;
  };
}

// --- API Logic ---

const toolkitSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A fun title for the story" },
    storyText: {
      type: Type.STRING,
      description:
        "A decodable story with clear narrative structure. Double-check spelling and grammar.",
    },
    visualStyle: {
      type: Type.STRING,
      description: "A strict visual guide for the illustrator. MUST INCLUDE: 1. MAIN CHARACTER DETAILS (Name, Age, Skin Tone, Specific Hair Style/Color, Distinctive Clothing like 'yellow raincoat'). 2. ART STYLE (e.g., 'Soft storybook watercolor', 'Vibrant textured digital art'). 3. COLOR PALETTE. This string will be used as a constant prefix for every image prompt to ensure 100% consistency.",
    },
    questions: {
      type: Type.ARRAY,
      description: "4 specific comprehension questions",
      items: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            enum: ["Who", "What", "Where", "When"],
          },
          question: { type: Type.STRING },
          answer: { type: Type.STRING },
        },
        required: ["type", "question", "answer"],
      },
    },
    sequenceEvents: {
      type: Type.ARRAY,
      description: "4 key events from the story in chronological order for retelling.",
      items: {
        type: Type.OBJECT,
        properties: {
          order: { type: Type.INTEGER },
          text: { type: Type.STRING, description: "A very short caption (max 5-6 words) for the card. Simple vocabulary." },
          imagePrompt: { 
            type: Type.STRING, 
            description: "A literal visual description of the scene. CRITICAL: Avoid logical errors. If the text says 'searching for lost dog', the image must show the character looking and NOT show the dog. If the text says 'found the dog', show the dog. Describe exactly what is visible." 
          },
        },
        required: ["order", "text", "imagePrompt"],
      },
    },
    inference: {
      type: Type.OBJECT,
      properties: {
        scenario: { type: Type.STRING, description: "A prompt based on the story requiring inference." },
        starter: { type: Type.STRING, description: "I think..." },
        reasonStarter: { type: Type.STRING, description: "Because..." },
      },
      required: ["scenario", "starter", "reasonStarter"],
    },
  },
  required: ["title", "storyText", "visualStyle", "questions", "sequenceEvents", "inference"],
};

// --- Components ---

const Header = () => (
  <header className="text-center mb-8 no-print">
    <h1 style={{ fontFamily: "Fredoka, sans-serif", color: "#4F46E5", fontSize: "2rem", margin: "0.5rem 0" }}>
      Reading Toolkit Generator
    </h1>
    <p style={{ color: "#6B7280" }}>
      Generate, Print, Cut, and Learn! Aligned with Science of Reading.
    </p>
  </header>
);

const GeneratorForm = ({
  onGenerate,
  loading,
  statusMessage
}: {
  onGenerate: (topic: string, childName: string, difficulty: string) => void;
  loading: boolean;
  statusMessage: string;
}) => {
  const [topic, setTopic] = useState("");
  const [childName, setChildName] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) onGenerate(topic, childName.trim() || "the student", difficulty);
  };

  return (
    <div className="card no-print" style={{ maxWidth: "500px", margin: "0 auto 40px auto" }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        
        <div>
          <label style={{ fontWeight: "bold", fontSize: "1.1rem", display: "block", marginBottom: "4px" }}>
            Child's Name
          </label>
          <input
            type="text"
            placeholder="e.g., Pavi, Alex, Sam..."
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            style={{
              padding: "12px",
              fontSize: "1rem",
              borderRadius: "8px",
              border: "2px solid #E5E7EB",
              fontFamily: "Andika, sans-serif",
              width: "100%",
              boxSizing: "border-box"
            }}
            disabled={loading}
          />
        </div>

        <div>
          <label style={{ fontWeight: "bold", fontSize: "1.1rem", display: "block", marginBottom: "4px" }}>
            What should the story be about?
          </label>
          <input
            type="text"
            placeholder="e.g., A lost puppy, baking a cake..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            style={{
              padding: "12px",
              fontSize: "1rem",
              borderRadius: "8px",
              border: "2px solid #E5E7EB",
              fontFamily: "Andika, sans-serif",
              width: "100%",
              boxSizing: "border-box"
            }}
            disabled={loading}
          />
        </div>

        <div>
            <label style={{ fontWeight: "bold", fontSize: "1.1rem", display: "block", marginBottom: "4px" }}>
                Difficulty Level
            </label>
            <div style={{ display: "flex", gap: "10px" }}>
                {["Easy", "Medium", "Hard"].map((level) => (
                    <label key={level} style={{ 
                        flex: 1, 
                        cursor: loading ? "not-allowed" : "pointer",
                        background: difficulty === level ? "#E0E7FF" : "#F3F4F6",
                        border: difficulty === level ? "2px solid #4F46E5" : "2px solid transparent",
                        color: difficulty === level ? "#4F46E5" : "#6B7280",
                        padding: "10px",
                        borderRadius: "8px",
                        textAlign: "center",
                        fontWeight: difficulty === level ? "bold" : "normal",
                        transition: "all 0.2s"
                    }}>
                        <input 
                            type="radio" 
                            name="difficulty" 
                            value={level} 
                            checked={difficulty === level} 
                            onChange={(e) => setDifficulty(e.target.value)} 
                            style={{ display: "none" }} 
                            disabled={loading}
                        />
                        {level}
                    </label>
                ))}
            </div>
        </div>
        
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !topic}
          style={{ opacity: loading ? 0.7 : 1, marginTop: "8px" }}
        >
          {loading ? statusMessage : "Create Toolkit"}
        </button>
      </form>
    </div>
  );
};

// --- Toolkit Parts (The Printable Sections) ---

const PaperSheet = ({ children, title }: { children?: React.ReactNode; title?: string }) => (
  <div className="paper-sheet">
    {title && <h3 className="no-print" style={{ textAlign: "center", color: "#9CA3AF", marginBottom: '20px', marginTop: 0, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</h3>}
    {children}
  </div>
);

const StorySheet = ({ data }: { data: ToolkitData }) => (
  <PaperSheet title="Page 1: Reading Passage">
    <div
      style={{
        border: "3px solid #4F46E5",
        borderRadius: "16px",
        padding: "30px",
        position: "relative",
        minHeight: "500px",
        boxSizing: "border-box"
      }}
    >
      <div
        style={{
          backgroundColor: "#4F46E5",
          color: "white",
          padding: "6px 16px",
          borderRadius: "20px",
          position: "absolute",
          top: "-16px",
          left: "24px",
          fontFamily: "Fredoka, sans-serif",
          fontWeight: "bold",
          fontSize: "0.9rem"
        }}
      >
        READING PASSAGE
      </div>
      <h2 style={{ fontSize: "1.6rem", marginBottom: "16px", color: "#1F2937", marginTop: "10px" }}>{data.title}</h2>
      
      {data.storyImageUrl && (
        <div style={{ marginBottom: "20px", borderRadius: "8px", overflow: "hidden", border: "1px solid #E0E7FF", maxHeight: "350px", display: "flex", justifyContent: "center", background: '#f9fafb' }}>
          <img src={data.storyImageUrl} alt="Story illustration" style={{ maxWidth: "100%", maxHeight: "350px", objectFit: "contain" }} />
        </div>
      )}

      <p style={{ fontSize: "1.2rem", lineHeight: "1.8", color: "#374151", whiteSpace: 'pre-wrap', margin: 0 }}>{data.storyText}</p>
    </div>
  </PaperSheet>
);

const QuestionCards = ({ data }: { data: ToolkitData }) => (
  <PaperSheet title="Page 2: WH- Questions">
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "15px",
      }}
    >
      {data.questions.map((q, i) => (
        <div
          key={i}
          className="cutout-guide"
          style={{
            border: "2px dashed #9CA3AF",
            borderRadius: "12px",
            padding: "16px",
            backgroundColor: "#FEF3C7", // Soft yellow
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: "160px",
          }}
        >
          <div>
            <span
              style={{
                backgroundColor: "#D97706",
                color: "white",
                padding: "4px 10px",
                borderRadius: "8px",
                fontSize: "0.8rem",
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            >
              {q.type}
            </span>
            <p style={{ fontSize: "1.1rem", fontWeight: "bold", marginTop: "10px", lineHeight: "1.4" }}>{q.question}</p>
          </div>
          <div style={{ borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: "8px", marginTop: "12px" }}>
            <p style={{ fontSize: "0.9rem", color: "#666", fontStyle: "italic", margin: 0 }}>Ans: {q.answer}</p>
          </div>
        </div>
      ))}
    </div>
  </PaperSheet>
);

// --- Updated Sequence Component based on Sketch ---

type SequenceEvent = ToolkitData['sequenceEvents'][0];

const DraggableCard = ({ event, isDragging }: { event: SequenceEvent, isDragging: boolean }) => {
  return (
    <div className={`draggable-card ${isDragging ? 'dragging' : ''}`}>
       {event.imageUrl ? (
          <img src={event.imageUrl} alt={event.text} className="card-image" />
        ) : (
          <div className="card-image" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#999', background: '#f3f4f6'}}>
            Generating...
          </div>
       )}
       <div style={{textAlign: 'center', fontWeight: 500, overflowWrap: 'break-word', hyphens: 'auto'}}>{event.text}</div>
    </div>
  );
};

const SequenceCards = ({ data }: { data: ToolkitData }) => {
  const [slots, setSlots] = useState<(SequenceEvent | null)[]>([null, null, null, null]);
  const [pool, setPool] = useState<SequenceEvent[]>([]);
  const [draggedItem, setDraggedItem] = useState<{ item: SequenceEvent, source: 'pool' | 'slot', index: number } | null>(null);

  useEffect(() => {
    // Initial shuffle for the "Mixed up cards" area
    const shuffled = [...data.sequenceEvents].sort(() => Math.random() - 0.5);
    setSlots([null, null, null, null]);
    setPool(shuffled);
  }, [data.sequenceEvents]);

  const handleDragStart = (e: React.DragEvent, item: SequenceEvent, source: 'pool' | 'slot', index: number) => {
    setDraggedItem({ item, source, index });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDropOnSlot = (e: React.DragEvent, targetSlotIndex: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const newSlots = [...slots];
    const newPool = [...pool];
    const targetItem = newSlots[targetSlotIndex]; // Item currently in the slot, if any

    // 1. Remove from source
    if (draggedItem.source === 'pool') {
        newPool.splice(draggedItem.index, 1);
    } else {
        newSlots[draggedItem.index] = null; // Clear old slot
    }

    // 2. Handle Target
    if (targetItem) {
        // If slot is occupied, move occupant to pool (swap behavior essentially, but simpler to just dump to pool)
        newPool.push(targetItem);
    }

    // 3. Place dragged item
    newSlots[targetSlotIndex] = draggedItem.item;

    setSlots(newSlots);
    setPool(newPool);
    setDraggedItem(null);
  };

  const handleDropOnPool = (e: React.DragEvent) => {
      e.preventDefault();
      if (!draggedItem) return;
      
      // If dragging from pool to pool, do nothing (or reorder, but simple is fine)
      if (draggedItem.source === 'pool') return;

      // If dragging from slot to pool
      const newSlots = [...slots];
      const newPool = [...pool];

      newSlots[draggedItem.index] = null; // Remove from slot
      newPool.push(draggedItem.item); // Add to pool

      setSlots(newSlots);
      setPool(newPool);
      setDraggedItem(null);
  };

  const handleReset = () => {
     const shuffled = [...data.sequenceEvents].sort(() => Math.random() - 0.5);
     setSlots([null, null, null, null]);
     setPool(shuffled);
  }

  return (
    <PaperSheet title="Page 3: Sequence Template (Velcro Kit)">
      <div className="worksheet-container">
        
        {/* Top Section: The Target Slots */}
        <div>
            <div className="no-print" style={{textAlign: 'center', marginBottom: '10px', color: '#6B7280', fontSize: '0.9rem'}}>
                Step 1: Print this page. Step 2: Paste Velcro dots in boxes below.
            </div>
            <div className="slot-row">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="slot-container">
                        <div className="slot-number">{i + 1}</div>
                        <div 
                            className={`drop-zone ${draggedItem ? 'active' : ''}`}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDropOnSlot(e, i)}
                        >
                            {slots[i] ? (
                                <div 
                                    draggable 
                                    onDragStart={(e) => handleDragStart(e, slots[i]!, 'slot', i)}
                                    style={{width: '100%', height: '100%'}}
                                >
                                    <DraggableCard event={slots[i]!} isDragging={false} />
                                </div>
                            ) : (
                                <span className="no-print" style={{color: '#CBD5E1', fontSize: '0.8rem'}}>Drop Here</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div style={{borderBottom: '2px dashed #CBD5E1', margin: '10px 0', position: 'relative'}}>
             <span style={{position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '0 10px', color: '#9CA3AF', fontSize: '0.8rem'}}>
                ✂️ CUT HERE ✂️
             </span>
        </div>

        {/* Bottom Section: The Pool */}
        <div 
            className="pool-row"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropOnPool}
        >
             {pool.map((event, i) => (
                 <div 
                    key={event.id} 
                    draggable 
                    onDragStart={(e) => handleDragStart(e, event, 'pool', i)}
                 >
                     <DraggableCard event={event} isDragging={false} />
                 </div>
             ))}
             {pool.length === 0 && (
                 <div style={{gridColumn: '1 / -1', textAlign: 'center', color: '#D97706', alignSelf: 'center'}}>
                    Great job! All cards placed.
                 </div>
             )}
        </div>

        <div className="no-print" style={{display: 'flex', justifyContent: 'center'}}>
             <button onClick={handleReset} className="btn" style={{background: '#fff', border: '1px solid #ddd'}}>
                 Reset for Printing
             </button>
        </div>

      </div>
    </PaperSheet>
  );
};

const InferenceBoard = ({ data }: { data: ToolkitData }) => (
  <PaperSheet title="Page 4: Inference Engine">
    <div
      style={{
        border: "3px solid #F472B6", // Pink
        borderRadius: "16px",
        padding: "24px",
        backgroundColor: "#FDF2F8",
        height: "100%",
        boxSizing: "border-box"
      }}
    >
      <h2 style={{ color: "#DB2777", marginBottom: "16px", fontFamily: "Fredoka", fontSize: "1.4rem", marginTop: 0 }}>Detective {data.childName}'s Inference Board</h2>
      
      <div style={{ backgroundColor: "white", padding: "16px", borderRadius: "12px", marginBottom: "20px", border: "2px solid #FBCFE8" }}>
        <p style={{ fontWeight: "bold", color: "#DB2777", marginBottom: "4px", fontSize: "0.9rem" }}>THE CLUE (From Story):</p>
        <p style={{ fontSize: "1.1rem", margin: 0 }}>{data.inference.scenario}</p>
      </div>

      <div style={{ display: "flex", gap: "16px", flexDirection: "column" }}>
        <div
          className="cutout-guide"
          style={{
            backgroundColor: "white",
            padding: "16px",
            borderRadius: "12px",
            border: "2px dashed #DB2777",
            minHeight: "80px",
          }}
        >
           <p style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#DB2777", marginTop: 0 }}>I think...</p>
           <div style={{ borderBottom: "2px solid #eee", marginTop: "30px" }}></div>
        </div>

        <div
            className="cutout-guide"
          style={{
            backgroundColor: "white",
            padding: "16px",
            borderRadius: "12px",
            border: "2px dashed #DB2777",
            minHeight: "80px",
          }}
        >
           <p style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#DB2777", marginTop: 0 }}>Because...</p>
           <div style={{ borderBottom: "2px solid #eee", marginTop: "30px" }}></div>
        </div>
      </div>
    </div>
  </PaperSheet>
);

// --- Main Application ---

const App = () => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Generating Toolkit...");
  const [toolkitData, setToolkitData] = useState<ToolkitData | null>(null);

  // Helper to extract base64 image from response
  const extractImage = (response: any): string | undefined => {
    for (const candidate of response.candidates || []) {
        for (const part of candidate.content?.parts || []) {
            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            }
        }
    }
    return undefined;
  };

  const handleGenerate = async (topic: string, childName: string, difficulty: string) => {
    setLoading(true);
    setStatusMessage("Warming up...");
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        setStatusMessage("Writing Story...");
        setToolkitData(null);

        // Define complexity instructions
        let complexityInstruction = "";
        if (difficulty === "Easy") {
            complexityInstruction = "Level: Easy/Early Reader (Grade 1). Text: Simple S-V-O sentences. High repetition. 80-100 words. Questions: Very direct (Explicit retrieval). Inference: Extremely obvious clue.";
        } else if (difficulty === "Medium") {
            complexityInstruction = "Level: Standard Grade 2. Text: Varied sentence structure. ~120 words. Narrative flow. Questions: Standard comprehension. Inference: Clear clue.";
        } else {
            complexityInstruction = "Level: Advanced Grade 2 / Early Grade 3. Text: Complex sentences, richer vocabulary. ~150 words. Questions: Requires synthesis. Inference: Subtle clue.";
        }

        const textResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
            {
                role: "user",
                parts: [
                {
                    text: `Create a reading toolkit for a student named ${childName} based on the topic: "${topic}".
                    
                    DIFFICULTY: ${difficulty}
                    ${complexityInstruction}
                    
                    Strictly adhere to literacy standards:
                    - Simple sentences (unless Hard mode).
                    - Decodable words.
                    - Check for spelling and grammatical errors. Ensure 100% accuracy.
                    
                    Goals:
                    1. Reading passage: Decodable, engaging, narrative structure.
                    2. 4 WH questions (Who, What, Where, When).
                    3. 4 Sequence events (for retelling) - Keep text VERY brief (max 6 words per card).
                    4. 1 Inference task (I think... because...) based on a clue in the text.
                    5. visualStyle: Define a detailed and CONSISTENT art style and character description for images.

                    Output strict JSON.`,
                },
                ],
            },
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: toolkitSchema,
                systemInstruction: "You are an expert elementary school teacher. You generate error-free, grade-level appropriate educational content."
            },
        });

        if (!textResponse.text) throw new Error("No text generated");
        const initialData = JSON.parse(textResponse.text) as ToolkitData;

        // Add unique IDs for drag and drop stability
        const eventsWithIds = initialData.sequenceEvents.map((e, idx) => ({
            ...e,
            id: `evt-${Date.now()}-${idx}`
        }));
        
        const dataWithIds = { ...initialData, sequenceEvents: eventsWithIds, childName };
        setToolkitData(dataWithIds);

        // 2. Generate Main Story Image using the Consistent Visual Style
        setStatusMessage("Illustrating Story...");
        const storyImgResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { 
                parts: [{ 
                    text: `Illustration for children's story: "${initialData.title}". 
                    
                    STRICT VISUAL STYLE GUIDE: ${initialData.visualStyle}
                    
                    SCENE DESCRIPTION: An establishing shot showing the main character in the setting.
                    Action context: ${initialData.storyText.substring(0, 150)}...
                    
                    Ensure the character matches the style guide perfectly.` 
                }] 
            },
            config: { imageConfig: { aspectRatio: "4:3" } },
        });
        
        const storyImgUrl = extractImage(storyImgResponse);
        const dataWithStoryImg = { ...dataWithIds, storyImageUrl: storyImgUrl };
        setToolkitData(dataWithStoryImg);

        // 3. Generate Sequence Images using the SAME Visual Style
        const updatedEvents = [];
        for (let i = 0; i < dataWithStoryImg.sequenceEvents.length; i++) {
            setStatusMessage(`Illustrating Card ${i + 1}/4...`);
            const event = dataWithStoryImg.sequenceEvents[i];
            try {
                const seqImgResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: { 
                        parts: [{ 
                            text: `Children's book illustration for sequence card.
                            
                            STRICT VISUAL STYLE GUIDE: ${initialData.visualStyle}
                            
                            SCENE DESCRIPTION: ${event.imagePrompt}
                            
                            CONSTRAINT: Maintain strict character consistency with the style guide.` 
                        }] 
                    },
                    config: { imageConfig: { aspectRatio: "1:1" } },
                });
                updatedEvents.push({ ...event, imageUrl: extractImage(seqImgResponse) });
            } catch (e) {
                console.error(`Failed to generate image for event ${i}`, e);
                updatedEvents.push(event);
            }
        }

        setToolkitData({ ...dataWithStoryImg, sequenceEvents: updatedEvents });

    } catch (error) {
      console.error("Error generating toolkit:", error);
      alert("Something went wrong! Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (window.confirm("Are you sure you want to print this toolkit?")) {
      window.print();
    }
  };

  return (
    <div>
      <Header />
      <GeneratorForm onGenerate={handleGenerate} loading={loading} statusMessage={statusMessage} />

      {toolkitData && (
        <div className="animate-fade-in">
           <div className="no-print" style={{display: 'flex', justifyContent: 'center', marginBottom: '20px'}}>
              <button onClick={handlePrint} className="btn btn-primary" style={{backgroundColor: '#10B981', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 30px', fontSize: '1.2rem'}}>
                <span>🖨️</span> Print Toolkit
              </button>
           </div>

           <div id="printable-area">
              <StorySheet data={toolkitData} />
              <QuestionCards data={toolkitData} />
              <SequenceCards data={toolkitData} />
              <InferenceBoard data={toolkitData} />
           </div>
        </div>
      )}
    </div>
  );
};

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
}