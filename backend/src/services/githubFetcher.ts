import axios from 'axios';
import AdmZip from 'adm-zip';

export interface FileData {
  path: string;
  content: string;
}

export class GitHubFetcher {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async fetchRepoSourceCode(owner: string, repo: string, commitSha: string): Promise<FileData[]> {
    try {
      // GitHub API supports zipball download
      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/zipball/${commitSha}`,
        {
          headers: {
            Authorization: `token ${this.accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
          responseType: 'arraybuffer',
        }
      );

      // Parse the ZIP file in memory
      const zip = new AdmZip(Buffer.from(response.data));
      const zipEntries = zip.getEntries();
      const files: FileData[] = [];

      for (const entry of zipEntries) {
        if (!entry.isDirectory) {
          const path = entry.entryName;
          
          // Allow any source-code like files, exclude binary formats and large generated artifacts
          const isBinaryOrIgnored = path.match(/\.(png|jpg|jpeg|gif|ico|svg|zip|tar|gz|pdf|woff|woff2|ttf|eot|mp4|mp3|exe|dll|so|dylib|bin)$/i) || 
                                    path.includes('node_modules/') || 
                                    path.includes('venv/') ||
                                    path.includes('.git/') ||
                                    path.includes('__pycache__/') ||
                                    path.includes('dist/') || 
                                    path.includes('build/') ||
                                    path.includes('.min.js') ||
                                    path.includes('.min.css');

          if (!isBinaryOrIgnored) {
            files.push({
              path: path.split('/').slice(1).join('/'), // Remove the root folder name from the zip
              content: entry.getData().toString('utf8'),
            });
          }
        }
      }

      return files;
    } catch (error) {
      console.error(`Failed to fetch and extract source code for ${owner}/${repo}@${commitSha}:`, error);
      throw new Error('Failed to fetch repository source code');
    }
  }
}
