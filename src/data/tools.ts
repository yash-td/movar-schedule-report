export interface Tool {
  id: string;
  name: string;
  description: string;
  url: string;
  tags: string[];
}

export const tools: Tool[] = [
  {
    id: 'metagpt',
    name: 'MetaGPT',
    description: 'Multi-agent framework that transforms natural language requirements into full-fledged software applications by assigning different roles like product manager, architect, and programmer',
    url: 'https://github.com/geekan/MetaGPT',
    tags: ['Software Development', 'AI Agents', 'Open Source']
  },
  {
    id: 'ollama',
    name: 'Ollama',
    description: 'Run large language models locally with a simple API. Supports various models like Llama 2, CodeLlama, and Mistral',
    url: 'https://ollama.ai',
    tags: ['Local AI', 'LLM', 'Open Source']
  },
  {
    id: 'windsurf',
    name: 'WindSurf',
    description: 'The first agentic IDE where developers and AI flow together, creating a magical coding experience',
    url: 'https://codeium.com/windsurf',
    tags: ['IDE', 'AI Agent', 'Development']
  },
  {
    id: 'bolt-new',
    name: 'Bolt.New',
    description: 'AI-powered web development agent for building, editing, running, and deploying full-stack applications directly in the browser',
    url: 'https://bolt.new',
    tags: ['Development', 'AI Agent', 'WebContainers']
  },
  {
    id: 'huggingface',
    name: 'HuggingFace',
    description: 'Open-source platform providing state-of-the-art machine learning models, datasets, and tools for AI development',
    url: 'https://huggingface.co',
    tags: ['Machine Learning', 'AI Models', 'Open Source']
  },
  {
    id: 'lm-studio',
    name: 'LM Studio',
    description: 'Run AI models locally on your device without requiring internet connection for complete privacy and offline access',
    url: 'https://lmstudio.ai',
    tags: ['Offline', 'Local AI', 'Privacy']
  },
  {
    id: 'khoj',
    name: 'Khoj.dev',
    description: 'Agentic AI Tool to scrape the internet and create visualizations on the fly',
    url: 'https://khoj.dev',
    tags: ['Web Scraping', 'Visualization', 'AI Agent']
  },
  {
    id: 'privatellm',
    name: 'PrivateLLM',
    description: 'Mobile application to run LLMs without internet',
    url: 'https://privatellm.com',
    tags: ['Mobile', 'Offline', 'LLM']
  },
  {
    id: 'gamma',
    name: 'Gamma.app',
    description: 'Create great PowerPoint presentations within seconds using simple 2-line prompts',
    url: 'https://gamma.app',
    tags: ['Presentations', 'AI Generation', 'Productivity']
  },
  {
    id: 'anthropic-claude',
    name: 'Anthropic Claude',
    description: 'State of the Art LLM like ChatGPT. Helps you build flowcharts or web apps and even publishes them for free. Example used: Tic Tac Toe game',
    url: 'https://claude.ai',
    tags: ['LLM', 'Development', 'AI Assistant']
  },
  {
    id: 'napkin',
    name: 'Napkin.ai',
    description: 'Generate professional process diagrams and flowcharts from simple text descriptions using AI',
    url: 'https://www.napkin.ai',
    tags: ['Visualization', 'Diagrams', 'Flowcharts']
  }
];