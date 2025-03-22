/**
 * API Server for handling REST API requests
 * This complements the WebSocket server for non-real-time operations
 */
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { createClient } = require("@supabase/supabase-js");

// Initialize Express app
const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes

// Context Rules API
app.get("/api/context-rules", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("context_rules")
      .select("*")
      .order("priority", { ascending: false });

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching context rules:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/context-rules/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("context_rules")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Context rule not found" });

    res.status(200).json(data);
  } catch (error) {
    console.error(`Error fetching context rule ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/context-rules", async (req, res) => {
  try {
    const { name, description, content, isActive, priority } = req.body;

    if (!name || !content) {
      return res.status(400).json({ error: "Name and content are required" });
    }

    const { data, error } = await supabase
      .from("context_rules")
      .insert([
        {
          name,
          description,
          content,
          is_active: isActive !== undefined ? isActive : true,
          priority: priority || 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error("Error creating context rule:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/context-rules/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, content, isActive, priority } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (content !== undefined) updates.content = content;
    if (isActive !== undefined) updates.is_active = isActive;
    if (priority !== undefined) updates.priority = priority;

    const { data, error } = await supabase
      .from("context_rules")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Context rule not found" });

    res.status(200).json(data);
  } catch (error) {
    console.error(`Error updating context rule ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/context-rules/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from("context_rules")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    console.error(`Error deleting context rule ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Widget Configuration API
app.get("/api/widget-configs", async (req, res) => {
  try {
    const { data, error } = await supabase.from("widget_configs").select("*");

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching widget configs:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/widget-configs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("widget_configs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data)
      return res.status(404).json({ error: "Widget config not found" });

    res.status(200).json(data);
  } catch (error) {
    console.error(`Error fetching widget config ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/widget-configs", async (req, res) => {
  try {
    const {
      name,
      primary_color,
      position,
      initial_state,
      allow_attachments,
      allow_voice,
      allow_emoji,
      context_mode,
      context_rule_id,
      welcome_message,
      placeholder_text,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const { data, error } = await supabase
      .from("widget_configs")
      .insert([
        {
          name,
          primary_color: primary_color || "#3b82f6",
          position: position || "bottom-right",
          initial_state: initial_state || "minimized",
          allow_attachments:
            allow_attachments !== undefined ? allow_attachments : true,
          allow_voice: allow_voice !== undefined ? allow_voice : true,
          allow_emoji: allow_emoji !== undefined ? allow_emoji : true,
          context_mode: context_mode || "general",
          context_rule_id,
          welcome_message: welcome_message || "How can I help you today?",
          placeholder_text: placeholder_text || "Type your message here...",
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error("Error creating widget config:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/widget-configs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};

    // Only include fields that are provided in the request
    const allowedFields = [
      "name",
      "primary_color",
      "position",
      "initial_state",
      "allow_attachments",
      "allow_voice",
      "allow_emoji",
      "context_mode",
      "context_rule_id",
      "welcome_message",
      "placeholder_text",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        // Convert camelCase to snake_case for database
        const dbField = field.replace(/([A-Z])/g, "_$1").toLowerCase();
        updates[dbField] = req.body[field];
      }
    });

    const { data, error } = await supabase
      .from("widget_configs")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    if (!data)
      return res.status(404).json({ error: "Widget config not found" });

    res.status(200).json(data);
  } catch (error) {
    console.error(`Error updating widget config ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/widget-configs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from("widget_configs")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    console.error(`Error deleting widget config ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Chat History API
app.get("/api/chat-history", async (req, res) => {
  try {
    const { user_id, widget_id, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)
      .offset(offset);

    if (user_id) query = query.eq("user_id", user_id);
    if (widget_id) query = query.eq("widget_id", widget_id);

    const { data, error } = await query;

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ error: error.message });
  }
});

// Analytics API
app.get("/api/analytics/overview", async (req, res) => {
  try {
    // Get total messages
    const { count: totalMessages, error: messagesError } = await supabase
      .from("chat_messages")
      .count();

    if (messagesError) throw messagesError;

    // Get total users
    const { count: totalUsers, error: usersError } = await supabase
      .from("users")
      .count();

    if (usersError) throw usersError;

    // Get total widgets
    const { count: totalWidgets, error: widgetsError } = await supabase
      .from("widget_configs")
      .count();

    if (widgetsError) throw widgetsError;

    // Get messages per day for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: messagesPerDay, error: messagesPerDayError } = await supabase
      .from("chat_messages")
      .select("created_at")
      .gte("created_at", sevenDaysAgo.toISOString());

    if (messagesPerDayError) throw messagesPerDayError;

    // Process messages per day
    const messagesByDay = {};
    messagesPerDay.forEach((message) => {
      const date = new Date(message.created_at).toISOString().split("T")[0];
      messagesByDay[date] = (messagesByDay[date] || 0) + 1;
    });

    // Format for chart display
    const chartData = Object.entries(messagesByDay).map(([date, count]) => ({
      date,
      count,
    }));

    res.status(200).json({
      totalMessages,
      totalUsers,
      totalWidgets,
      messagesPerDay: chartData,
    });
  } catch (error) {
    console.error("Error fetching analytics overview:", error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing API server");
  server.close(() => {
    console.log("API server closed");
    process.exit(0);
  });
});

module.exports = app;
