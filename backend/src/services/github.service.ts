import axios from 'axios';

export class GitHubService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private get headers() {
    return {
      Authorization: `token ${this.accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    };
  }

  async getUserRepositories() {
    try {
      const response = await axios.get('https://api.github.com/user/repos', {
        headers: this.headers,
        params: {
          visibility: 'all',
          sort: 'updated',
          per_page: 100,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
      throw new Error('Failed to fetch repositories from GitHub');
    }
  }

  async getRepository(owner: string, repo: string) {
    try {
      const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: this.headers,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch repository:', error);
      throw new Error('Failed to fetch repository details from GitHub');
    }
  }

  async getRepoCommits(owner: string, repo: string, perPage: number = 30) {
    try {
      const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/commits`, {
        headers: this.headers,
        params: {
          per_page: perPage
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch repository commits:', error);
      throw new Error('Failed to fetch commits from GitHub');
    }
  }
}
