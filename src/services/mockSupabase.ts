/**
 * Mock Supabase client for development without actual Supabase connection
 * This prevents the "supabaseUrl is required" error when environment variables are not set
 */

class MockSupabaseClient {
  private storage: {
    [table: string]: any[];
  } = {
    chat_messages: [],
    chat_sessions: [],
    context_rules: [],
    prompt_templates: [],
    ai_interaction_logs: [],
    users: [],
  };

  constructor() {
    // Initialize with some sample data
    this.storage.context_rules = [
      {
        id: "1",
        name: "General Assistance",
        description:
          "General purpose AI assistant that can answer a wide range of questions.",
        is_active: true,
        context_type: "general",
        keywords: ["help", "assistance", "general"],
        excluded_topics: [],
        prompt_template: null,
        response_filters: [],
        preferred_model: "gemini",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Business Support",
        description:
          "Business-focused assistant that helps with professional inquiries.",
        is_active: true,
        context_type: "business",
        keywords: ["business", "professional", "work"],
        excluded_topics: ["personal", "entertainment"],
        prompt_template: null,
        response_filters: [],
        preferred_model: "gemini",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }

  // Generic query builder
  from(table: string) {
    let filteredData = [...(this.storage[table] || [])];
    let selectedFields: string[] | null = null;
    let countEnabled = false;

    const api = {
      select: (fields: string, options?: { count: string }) => {
        selectedFields =
          fields === "*" ? null : fields.split(",").map((f) => f.trim());
        countEnabled = options?.count === "exact";
        return api;
      },
      eq: (field: string, value: any) => {
        filteredData = filteredData.filter((item) => {
          // Handle null value specially
          if (value === "null") {
            return item[field] === null;
          }
          return item[field] === value;
        });
        return api;
      },
      neq: (field: string, value: any) => {
        filteredData = filteredData.filter((item) => item[field] !== value);
        return api;
      },
      gt: (field: string, value: any) => {
        filteredData = filteredData.filter((item) => item[field] > value);
        return api;
      },
      gte: (field: string, value: any) => {
        filteredData = filteredData.filter((item) => item[field] >= value);
        return api;
      },
      lt: (field: string, value: any) => {
        filteredData = filteredData.filter((item) => item[field] < value);
        return api;
      },
      lte: (field: string, value: any) => {
        filteredData = filteredData.filter((item) => item[field] <= value);
        return api;
      },
      or: (conditions: string) => {
        // Simple implementation for basic OR conditions
        // This is a simplified version and won't handle all cases
        return api;
      },
      order: (field: string, { ascending = true } = {}) => {
        filteredData.sort((a, b) => {
          if (ascending) {
            return a[field] > b[field] ? 1 : -1;
          } else {
            return a[field] < b[field] ? 1 : -1;
          }
        });
        return api;
      },
      range: (from: number, to: number) => {
        filteredData = filteredData.slice(from, to + 1);
        return api;
      },
      single: () => {
        return api.then();
      },
      insert: (data: any) => {
        const newData = Array.isArray(data) ? data : [data];

        // Add IDs and timestamps if not provided
        newData.forEach((item) => {
          if (!item.id) item.id = crypto.randomUUID();
          if (!item.created_at) item.created_at = new Date().toISOString();
        });

        this.storage[table] = [...(this.storage[table] || []), ...newData];

        return {
          select: () => ({
            single: () => api.then(),
          }),
          then: () => api.then(),
        };
      },
      update: (data: any) => {
        return {
          eq: (field: string, value: any) => ({
            select: () => ({
              single: () => api.then(),
            }),
            then: () => api.then(),
          }),
        };
      },
      delete: () => {
        return {
          eq: (field: string, value: any) => ({
            then: () => api.then(),
          }),
        };
      },
      then: async () => {
        // Process the data based on selected fields
        let result = filteredData;

        // Return mock response
        return {
          data:
            result.length > 0
              ? result.length === 1 && api.single
                ? result[0]
                : result
              : null,
          error: null,
          count: countEnabled ? filteredData.length : null,
        };
      },
    };

    return api;
  }

  // Auth methods
  auth = {
    getUser: async () => {
      return {
        data: {
          user: {
            id: "mock-user-id",
            email: "mock@example.com",
          },
        },
        error: null,
      };
    },
  };
}

// Create a mock client
const mockSupabase = new MockSupabaseClient();

export default mockSupabase;
