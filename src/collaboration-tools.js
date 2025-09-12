/**
 * Collaboration MCP Tools for Claude-to-Claude cooperation
 * These tools enable real-time collaboration between multiple Claude Code instances
 */

export const collaborationTools = [
  // =============================================
  // Agent Session Management
  // =============================================
  {
    name: 'start_agent_session',
    description: 'Start a new agent session (developer or supervisor)',
    inputSchema: {
      type: 'object',
      properties: {
        agent_type: {
          type: 'string',
          enum: ['developer', 'supervisor'],
          description: 'Type of agent session to start'
        },
        agent_name: {
          type: 'string',
          description: 'Optional display name for the agent'
        },
        project_id: {
          type: 'string',
          description: 'Project ID this session is working on (optional)'
        },
        notification_preferences: {
          type: 'object',
          description: 'Notification preferences (JSON object)'
        }
      },
      required: ['agent_type']
    }
  },
  {
    name: 'update_agent_status',
    description: 'Update current agent session status and activity',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: {
          type: 'string',
          description: 'Agent session ID'
        },
        status: {
          type: 'string',
          enum: ['active', 'idle', 'offline'],
          description: 'New status'
        },
        current_activity: {
          type: 'string',
          description: 'What the agent is currently doing'
        },
        current_task_id: {
          type: 'string',
          description: 'Task ID currently being worked on'
        },
        progress_notes: {
          type: 'string',
          description: 'Latest progress notes'
        }
      },
      required: ['session_id']
    }
  },
  {
    name: 'send_heartbeat',
    description: 'Send heartbeat to keep session alive',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: {
          type: 'string',
          description: 'Agent session ID'
        }
      },
      required: ['session_id']
    }
  },
  {
    name: 'get_active_sessions',
    description: 'Get all currently active agent sessions',
    inputSchema: {
      type: 'object',
      properties: {
        agent_type: {
          type: 'string',
          enum: ['developer', 'supervisor'],
          description: 'Filter by agent type (optional)'
        },
        project_id: {
          type: 'string',
          description: 'Filter by project ID (optional)'
        }
      }
    }
  },
  {
    name: 'end_agent_session',
    description: 'End current agent session',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: {
          type: 'string',
          description: 'Agent session ID to end'
        }
      },
      required: ['session_id']
    }
  },

  // =============================================
  // Real-time Communication
  // =============================================
  {
    name: 'send_message',
    description: 'Send message to another agent or broadcast',
    inputSchema: {
      type: 'object',
      properties: {
        from_session_id: {
          type: 'string',
          description: 'Sender session ID'
        },
        to_session_id: {
          type: 'string',
          description: 'Recipient session ID (null for broadcast)'
        },
        message_type: {
          type: 'string',
          enum: ['progress_update', 'question', 'feedback', 'approval_request', 'direction_change', 'task_assignment', 'status_alert'],
          description: 'Type of message'
        },
        subject: {
          type: 'string',
          description: 'Brief subject line'
        },
        content: {
          type: 'string',
          description: 'Main message content'
        },
        priority: {
          type: 'string',
          enum: ['urgent', 'high', 'normal', 'low'],
          description: 'Message priority'
        },
        related_task_id: {
          type: 'string',
          description: 'Related task ID (optional)'
        },
        related_prd_id: {
          type: 'string',
          description: 'Related PRD ID (optional)'
        },
        response_required: {
          type: 'boolean',
          description: 'Whether response is required'
        },
        response_deadline: {
          type: 'string',
          description: 'Response deadline (ISO datetime)'
        }
      },
      required: ['from_session_id', 'message_type', 'content']
    }
  },
  {
    name: 'get_messages',
    description: 'Get messages for current session',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: {
          type: 'string',
          description: 'Session ID to get messages for'
        },
        unread_only: {
          type: 'boolean',
          description: 'Only return unread messages'
        },
        message_type: {
          type: 'string',
          enum: ['progress_update', 'question', 'feedback', 'approval_request', 'direction_change', 'task_assignment', 'status_alert'],
          description: 'Filter by message type'
        },
        limit: {
          type: 'number',
          description: 'Limit number of messages returned'
        }
      },
      required: ['session_id']
    }
  },
  {
    name: 'mark_message_read',
    description: 'Mark message as read',
    inputSchema: {
      type: 'object',
      properties: {
        message_id: {
          type: 'number',
          description: 'Message ID to mark as read'
        },
        session_id: {
          type: 'string',
          description: 'Session ID marking the message as read'
        }
      },
      required: ['message_id', 'session_id']
    }
  },
  {
    name: 'respond_to_message',
    description: 'Respond to a specific message',
    inputSchema: {
      type: 'object',
      properties: {
        original_message_id: {
          type: 'number',
          description: 'ID of message being responded to'
        },
        from_session_id: {
          type: 'string',
          description: 'Responder session ID'
        },
        response_content: {
          type: 'string',
          description: 'Response content'
        }
      },
      required: ['original_message_id', 'from_session_id', 'response_content']
    }
  },

  // =============================================
  // Supervisor Intervention Tools
  // =============================================
  {
    name: 'send_intervention',
    description: 'Supervisor sends intervention to developer',
    inputSchema: {
      type: 'object',
      properties: {
        supervisor_session_id: {
          type: 'string',
          description: 'Supervisor session ID'
        },
        developer_session_id: {
          type: 'string',
          description: 'Target developer session ID'
        },
        intervention_type: {
          type: 'string',
          enum: ['feedback', 'direction_change', 'approval', 'rejection', 'task_reassignment', 'priority_change', 'blocking', 'unblocking'],
          description: 'Type of intervention'
        },
        title: {
          type: 'string',
          description: 'Brief intervention title'
        },
        message: {
          type: 'string',
          description: 'Detailed intervention message'
        },
        related_task_id: {
          type: 'string',
          description: 'Related task ID (optional)'
        },
        priority: {
          type: 'string',
          enum: ['critical', 'urgent', 'normal', 'advisory'],
          description: 'Intervention priority'
        },
        requires_immediate_action: {
          type: 'boolean',
          description: 'Whether immediate action is required'
        },
        new_status: {
          type: 'string',
          description: 'New status to set (if applicable)'
        }
      },
      required: ['supervisor_session_id', 'developer_session_id', 'intervention_type', 'title', 'message']
    }
  },
  {
    name: 'get_pending_interventions',
    description: 'Get pending interventions for developer',
    inputSchema: {
      type: 'object',
      properties: {
        developer_session_id: {
          type: 'string',
          description: 'Developer session ID'
        },
        acknowledged_only: {
          type: 'boolean',
          description: 'Only return unacknowledged interventions'
        }
      },
      required: ['developer_session_id']
    }
  },
  {
    name: 'acknowledge_intervention',
    description: 'Developer acknowledges supervisor intervention',
    inputSchema: {
      type: 'object',
      properties: {
        intervention_id: {
          type: 'number',
          description: 'Intervention ID to acknowledge'
        },
        developer_session_id: {
          type: 'string',
          description: 'Developer session ID'
        },
        response: {
          type: 'string',
          description: 'Developer response to intervention'
        }
      },
      required: ['intervention_id', 'developer_session_id']
    }
  },

  // =============================================
  // Progress Monitoring Tools
  // =============================================
  {
    name: 'update_task_progress',
    description: 'Update detailed task progress with snapshot',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'Task ID being updated'
        },
        agent_session_id: {
          type: 'string',
          description: 'Agent session making the update'
        },
        progress_percentage: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          description: 'Progress percentage (0-100)'
        },
        work_description: {
          type: 'string',
          description: 'Description of work completed'
        },
        files_modified: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of file paths modified'
        },
        code_changes_summary: {
          type: 'string',
          description: 'Brief summary of code changes'
        },
        tests_added: {
          type: 'boolean',
          description: 'Whether tests were added'
        },
        tests_passed: {
          type: 'boolean',
          description: 'Whether tests are passing'
        },
        estimated_completion_time: {
          type: 'number',
          description: 'Estimated minutes remaining'
        },
        confidence_level: {
          type: 'number',
          minimum: 1,
          maximum: 10,
          description: 'Confidence level (1-10 scale)'
        },
        blockers_encountered: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of blocker descriptions'
        },
        needs_review: {
          type: 'boolean',
          description: 'Whether work needs supervisor review'
        }
      },
      required: ['task_id', 'agent_session_id', 'work_description']
    }
  },
  {
    name: 'get_task_progress_history',
    description: 'Get progress history for a task',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'Task ID to get progress for'
        },
        limit: {
          type: 'number',
          description: 'Limit number of progress entries'
        }
      },
      required: ['task_id']
    }
  },
  {
    name: 'monitor_active_development',
    description: 'Get real-time view of active development sessions',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'Filter by project ID (optional)'
        }
      }
    }
  },

  // =============================================
  // Approval Workflow Tools
  // =============================================
  {
    name: 'request_approval',
    description: 'Request approval for work or decision',
    inputSchema: {
      type: 'object',
      properties: {
        requester_session_id: {
          type: 'string',
          description: 'Session ID requesting approval'
        },
        approver_session_id: {
          type: 'string',
          description: 'Specific approver session ID (optional)'
        },
        workflow_type: {
          type: 'string',
          enum: ['task_completion', 'code_change', 'architecture_decision', 'deployment_approval', 'requirement_change'],
          description: 'Type of approval workflow'
        },
        title: {
          type: 'string',
          description: 'Approval request title'
        },
        description: {
          type: 'string',
          description: 'Detailed description of what needs approval'
        },
        related_task_id: {
          type: 'string',
          description: 'Related task ID (optional)'
        },
        approval_deadline: {
          type: 'string',
          description: 'Approval deadline (ISO datetime)'
        }
      },
      required: ['requester_session_id', 'workflow_type', 'title', 'description']
    }
  },
  {
    name: 'get_pending_approvals',
    description: 'Get pending approval requests',
    inputSchema: {
      type: 'object',
      properties: {
        approver_session_id: {
          type: 'string',
          description: 'Approver session ID (optional - null gets all)'
        },
        workflow_type: {
          type: 'string',
          enum: ['task_completion', 'code_change', 'architecture_decision', 'deployment_approval', 'requirement_change'],
          description: 'Filter by workflow type (optional)'
        }
      }
    }
  },
  {
    name: 'approve_request',
    description: 'Approve a pending request',
    inputSchema: {
      type: 'object',
      properties: {
        approval_id: {
          type: 'number',
          description: 'Approval workflow ID'
        },
        approver_session_id: {
          type: 'string',
          description: 'Approver session ID'
        },
        conditions: {
          type: 'string',
          description: 'Conditions for approval (optional)'
        }
      },
      required: ['approval_id', 'approver_session_id']
    }
  },
  {
    name: 'reject_request',
    description: 'Reject a pending request',
    inputSchema: {
      type: 'object',
      properties: {
        approval_id: {
          type: 'number',
          description: 'Approval workflow ID'
        },
        approver_session_id: {
          type: 'string',
          description: 'Approver session ID'
        },
        rejection_reason: {
          type: 'string',
          description: 'Reason for rejection'
        }
      },
      required: ['approval_id', 'approver_session_id', 'rejection_reason']
    }
  },

  // =============================================
  // Collaboration Analytics
  // =============================================
  {
    name: 'get_collaboration_dashboard',
    description: 'Get comprehensive collaboration dashboard data',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'Filter by project ID (optional)'
        },
        time_range: {
          type: 'string',
          enum: ['1hour', '6hours', '1day', '1week'],
          description: 'Time range for analytics'
        }
      }
    }
  },
  {
    name: 'get_session_analytics',
    description: 'Get analytics for specific session',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: {
          type: 'string',
          description: 'Session ID to analyze'
        }
      },
      required: ['session_id']
    }
  }
];

/**
 * Utility function to generate unique session IDs
 */
export function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Utility function to check if session is active
 */
export function isSessionActive(session) {
  const now = new Date();
  const lastHeartbeat = new Date(session.last_heartbeat);
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  
  return session.status === 'active' && lastHeartbeat > fiveMinutesAgo;
}