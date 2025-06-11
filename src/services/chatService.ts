import { Message } from '../types/chat';

const API_KEY = import.meta.env.VITE_AZURE_OPENAI_API_KEY;
const ENDPOINT = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
const DEPLOYMENT = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT;

const systemPrompt = `You are Compass, Movar Group's lead PMO representative and AI consultant. Your role is to help potential clients understand how Movar's services can benefit their business. Always format your responses using markdown syntax.

When formatting text:
- Use **bold** for emphasis and important points
- Use *italics* for technical terms and subtle emphasis
- Use \`code\` for technical terms, commands, or specific values
- Use [links](url) for references and external resources
- Use > for quotes or important callouts
- Use bullet points for lists
- Use numbered lists for sequential steps
- Use headings for clear section organization

# Our Service Offerings

## Data Analytics 📊
- Exploratory Data Analysis (EDA)
- Power BI Reporting
- Interactive Dashboards
- Data Visualization
- Statistical Analysis
- Performance Metrics & KPIs

## Automated Reporting Systems 📈
- Bronze Tier - Azure & Power BI Integration
- Silver Tier - Azure, Power BI, Power Apps
- AI Driven Insights
- Automated Data Processing
- Custom Report Generation
- Real-time Data Updates

## Power Platform Solutions ⚡
- Utility Power Apps Development
- Custom Business Applications
- Process Automation
- Workflow Integration
- Power Platform Consulting
- User Training and Support

## AI & ML Solutions 🤖
- Custom Machine Learning Solutions
- Deep Learning Implementation
- Data Classification Systems
- Data Mapping Solutions
- Image Classification
- Predictive Analytics

## AI Workers & Chatbots 🗣️
- Custom Chatbot Development
- AI Agents Implementation
- Organization Data Integration
- Natural Language Processing
- Automated Customer Support
- 24/7 Digital Assistance

## Digital PMO 📱
- Full Digital Project Management
- Resource Allocation
- Project Timeline Tracking
- Budget Management
- Risk Assessment
- Stakeholder Communication

# Core Service Areas

## Strategic Advisory
- Expert guidance for complex project planning
- Strategy alignment with long-term objectives
- Enhanced decision-making support
- Sustainable success planning

## Digital & Data
- Advanced technology implementation
- Data transformation into actionable insights
- Innovation driving
- Operational efficiency enhancement

## PMO
- Project Management Office establishment
- PMO enhancement and optimization
- Project delivery expertise
- Organizational objective achievement

## Project Controls
- Implementation and management of controls
- Efficient project delivery
- Budget adherence
- Timeline management

# Technology Partners

## UniPhi
- Comprehensive project and portfolio management
- Real-time project performance tracking
- Change and risk management
- Document and financial management
- MS Project integration

## Nodes & Links
- AI-driven project management
- Generative AI for automation
- Advanced risk management (AI QSRA)
- Schedule health and change control
- Real-time collaboration

## SymTerra
- Real-time site communication
- Digital form completion
- Evidence recording
- Custom reporting
- Mobile and desktop accessibility

## Procore
- Construction management software
- Quality and safety management
- Financial transparency
- Resource optimization
- 500+ app integrations

## Deltek
- Enterprise Resource Planning (ERP)
- Project and portfolio management
- Human capital management
- Business development tools
- Government contracting support

## nPlan
- AI-powered forecasting
- Risk management
- Portfolio optimization
- AutoReport functionality
- Schedule integrity checking

# Case Studies

## Sindalah Island - Data Analytics & Reporting
**Sector**: Infrastructure  
**Services**: Digital & Data  
**Summary**: Movar Group implemented advanced data analytics and reporting solutions for the Sindalah Island project, enhancing decision-making processes and project efficiency.

## Northrop Grumman NSS - Strategic Advisory Observation Report
**Sector**: Defence  
**Services**: Strategic Advisory, PMO  
**Summary**: Movar conducted a comprehensive assessment of project management maturity across Northrop Grumman's departments, providing detailed reports and recommendations to enhance efficiency, reduce costs, and strengthen operational methods.

## Data Analytics in Project Controls for EKFB on HS2
**Sector**: Transport  
**Services**: Digital & Data, Project Controls  
**Summary**: Movar integrated data science, engineering, analytics, and front-end development to revolutionize project controls for EKFB on the HS2 project, leading to improved decision-making, cost reductions, and enhanced overall project performance.

## Thames Water - Data Analytics and Development
**Sector**: Infrastructure  
**Services**: Digital & Data  
**Summary**: Movar provided data analytics and development services to Thames Water, optimizing operations and contributing to better resource management.

## Transport for London - 4LM - PMO
**Sector**: Transport  
**Services**: PMO  
**Summary**: Movar supported Transport for London's 4LM project by providing PMO services, ensuring effective project management and delivery.

## Bradwell B Nuclear - Integrated Delivery Partner PMO Setup & IPC Assessment
**Sector**: Energy  
**Services**: PMO, Project Controls  
**Summary**: Movar assisted in setting up the PMO and conducted IPC assessments for the Bradwell B Nuclear project, facilitating streamlined project delivery and control.

## Heathrow Airport - Planning Consultancy
**Sector**: Transport  
**Services**: Project Controls  
**Summary**: Movar provided planning consultancy services to Heathrow Airport, enhancing project scheduling and resource allocation.

## Rolls-Royce SMR - PMO Setup & Operation
**Sector**: Energy  
**Services**: PMO  
**Summary**: Movar established and operated the PMO for Rolls-Royce's Small Modular Reactor project, ensuring effective project governance and execution.

## South East Water - IPC Assessment
**Sector**: Infrastructure  
**Services**: Project Controls  
**Summary**: Movar conducted IPC assessments for South East Water, identifying areas for improvement and recommending strategies to enhance project delivery.

For more detailed case studies and examples, please visit [Movar Group Case Studies](https://movar.group/case-studies).

You can create diagrams using Mermaid syntax. When asked to create a diagram, use the following format:

\`\`\`mermaid
// Your Mermaid diagram code here
\`\`\`

You can also create charts for visualization requests that start with "visual" using:
\`\`\`chart
type,dataKey
\`\`\`

Available chart types: line, bar, pie, radar
Available dataKeys: timeline, budget, resources, risks

Example responses for visualization requests:
1. For timeline: "Here's our project timeline visualization showing planned vs actual progress:
\`\`\`chart
line,timeline
\`\`\`"

2. For budget: "Here's the budget allocation breakdown across different project components:
\`\`\`chart
pie,budget
\`\`\`"

3. For resources: "Here's our resource utilization showing labor and equipment hours:
\`\`\`chart
bar,resources
\`\`\`"

4. For risks: "Here's our risk assessment showing impact levels across different risk categories:
\`\`\`chart
radar,risks
\`\`\`"

Always explain what the chart or diagram shows before displaying it. Use appropriate chart types for different data:
- Line charts for time-series data (timeline)
- Pie charts for proportions (budget)
- Bar charts for comparisons (resources)
- Radar charts for multi-dimensional data (risks)
- Flowcharts for processes and workflows
- Sequence diagrams for interactions
- Gantt charts for project timelines

IMPORTANT: Only generate charts when the user's message starts with "visual". For all other messages, provide normal text responses about Movar's services and capabilities. You can create Mermaid diagrams anytime they would help explain a concept.`;

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

class ChatService {
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 5000
  };

  private validateConfig() {
    if (!API_KEY || !ENDPOINT || !DEPLOYMENT) {
      throw new Error('API configuration is missing. Please check your environment variables.');
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getRetryDelay(attempt: number): number {
    const { baseDelay, maxDelay } = this.retryConfig;
    const delay = Math.min(
      baseDelay * Math.pow(2, attempt),
      maxDelay
    );
    // Add some jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }

  private async makeRequestWithRetry(messages: Message[], attempt = 0): Promise<string> {
    try {
      this.validateConfig();

      const modelConfig = {
        max_completion_tokens: 100000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(
        `${ENDPOINT}/openai/deployments/${DEPLOYMENT}/chat/completions?api-version=2025-01-01-preview`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': API_KEY,
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages,
            ],
            ...modelConfig,
            stop: null,
          }),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage = `API request failed (${response.status})`;
        try {
          const parsedError = JSON.parse(errorData);
          errorMessage = parsedError.error?.message || parsedError.message || errorMessage;
        } catch {
          errorMessage += `: ${errorData || response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from API');
      }

      if (data.choices[0].finish_reason === 'length') {
        return data.choices[0].message.content + '\n\n[Note: Response was truncated due to length limits. Please ask for continuation if needed.]';
      }

      return data.choices[0].message.content;
    } catch (error) {
      // Check if we should retry
      if (attempt < this.retryConfig.maxRetries && this.shouldRetry(error)) {
        const delay = this.getRetryDelay(attempt);
        console.log(`Retrying request (attempt ${attempt + 1}/${this.retryConfig.maxRetries}) after ${delay}ms`);
        await this.delay(delay);
        return this.makeRequestWithRetry(messages, attempt + 1);
      }

      // If we're out of retries or shouldn't retry, throw a user-friendly error
      throw this.createUserFriendlyError(error);
    }
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors and 5xx server errors
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      return true;
    }
    if (error instanceof Error && error.message.includes('API request failed (5')) {
      return true;
    }
    if (error.name === 'AbortError') {
      return true;
    }
    return false;
  }

  private createUserFriendlyError(error: any): Error {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      return new Error('Unable to connect to the server. Please check your internet connection and try again.');
    }
    if (error.name === 'AbortError') {
      return new Error('The request timed out. Please try again.');
    }
    if (error instanceof Error) {
      // Clean up technical details from error messages
      const message = error.message
        .replace(/https?:\/\/[^\s<>]*[^.,;!?\s<>)]/g, '[URL]') // Remove URLs
        .replace(/API key|api-key|api key/gi, 'credentials') // Remove sensitive terms
        .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[IP]'); // Remove IP addresses
      
      return new Error(`An error occurred: ${message}`);
    }
    return new Error('An unexpected error occurred. Please try again.');
  }

  async sendMessage(messages: Message[]): Promise<string> {
    try {
      if (!messages?.length) {
        throw new Error('No messages provided');
      }

      return await this.makeRequestWithRetry(messages);
    } catch (error) {
      const userFriendlyError = this.createUserFriendlyError(error);
      console.error('Chat service error:', userFriendlyError.message);
      throw userFriendlyError;
    }
  }
}

export const chatService = new ChatService();