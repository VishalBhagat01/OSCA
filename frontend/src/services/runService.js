import api from "./api";

/**
 * Service methods for run orchestration and HITL actions.
 */
export const runService = {
  /**
   * Fetch all execution runs.
   */
  async getRuns() {
    const { data } = await api.get("/runs");
    return data.runs || data || [];
  },

  /**
   * Fetch a single execution run by ID.
   */
  async getRun(id) {
    const { data } = await api.get(`/runs/${id}`);
    return data.run || data;
  },

  /**
   * Queue a new execution run.
   */
  async createRun({ repoUrl, issueNumber }) {
    const { data } = await api.post("/runs", {
      repoUrl,
      issueNumber: Number(issueNumber),
    });
    return data;
  },

  /**
   * Delete an execution run.
   */
  async deleteRun(id) {
    const { data } = await api.delete(`/runs/${id}`);
    return data;
  },

  /**
   * Approve a run and trigger PR drafting on GitHub.
   */
  async approveRun(id, { reviewNotes = "", asDraft = true } = {}) {
    const { data } = await api.post(`/runs/${id}/approve`, {
      reviewNotes,
      asDraft,
    });
    return data;
  },

  /**
   * Reject a proposed patch.
   */
  async rejectRun(id) {
    const { data } = await api.post(`/runs/${id}/reject`);
    return data;
  },

  /**
   * Retry agent run with targeted reviewer instructions.
   */
  async retryRun(id, { feedback }) {
    const { data } = await api.post(`/runs/${id}/retry`, {
      feedback,
    });
    return data;
  },
};

export default runService;
