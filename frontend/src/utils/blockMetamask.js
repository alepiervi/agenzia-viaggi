// Block MetaMask auto-connection attempts
const blockMetaMaskConnection = () => {
  // Override window.ethereum to prevent auto-connection
  if (window.ethereum) {
    const originalEthereum = window.ethereum;
    
    // Create a proxy that blocks connection attempts
    window.ethereum = new Proxy(originalEthereum, {
      get(target, prop) {
        // Block specific methods that trigger connection
        if (prop === 'request' || prop === 'enable' || prop === 'send' || prop === 'sendAsync') {
          return () => {
            console.warn('MetaMask connection blocked - not needed for this application');
            return Promise.reject(new Error('MetaMask connection disabled'));
          };
        }
        
        // Block connect method specifically
        if (prop === 'connect') {
          return () => {
            console.warn('MetaMask connect blocked - not needed for this application');
            return Promise.reject(new Error('MetaMask connection disabled'));
          };
        }
        
        return target[prop];
      }
    });
  }
  
  // Also block any global web3 attempts
  if (window.web3) {
    window.web3 = undefined;
  }
  
  // Block common crypto detection methods
  window.isMetaMask = false;
  window.ethereum = window.ethereum || undefined;
};

// Execute immediately
blockMetaMaskConnection();

// Also execute after DOM is loaded
document.addEventListener('DOMContentLoaded', blockMetaMaskConnection);

// Execute on window load as well
window.addEventListener('load', blockMetaMaskConnection);

export default blockMetaMaskConnection;