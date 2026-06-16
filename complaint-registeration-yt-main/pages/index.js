import { useState, useEffect } from "react";
import { ethers } from "ethers";
import toast from "react-hot-toast";

const contractAddress = "enter address";

const contractABI = [
  {
    "inputs": [
      {"internalType": "string","name": "_name","type": "string"},
      {"internalType": "string","name": "_cnic","type": "string"},
      {"internalType": "string","name": "_title","type": "string"},
      {"internalType": "string","name": "_description","type": "string"}
    ],
    "name": "fileComplaint",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "_id","type": "uint256"}],
    "name": "resolveComplaint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "complaintCounter",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "_id","type": "uint256"}],
    "name": "getComplaint",
    "outputs": [
      {"internalType": "uint256","name": "id","type": "uint256"},
      {"internalType": "string","name": "name","type": "string"},
      {"internalType": "string","name": "cnic","type": "string"},
      {"internalType": "string","name": "title","type": "string"},
      {"internalType": "string","name": "description","type": "string"},
      {"internalType": "address","name": "complainant","type": "address"},
      {"internalType": "bool","name": "resolved","type": "bool"},
      {"internalType": "uint256","name": "timestamp","type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export default function Home() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [form, setForm] = useState({ name: "", cnic: "", title: "", description: "" });

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
        
        const contractInstance = new ethers.Contract(contractAddress, contractABI, signer);
        setContract(contractInstance);
        await loadComplaints(contractInstance);
        toast.success("Connected!");
      } catch (error) {
        toast.error("Failed to connect");
      }
    } else {
      toast.error("Install MetaMask!");
    }
  };

  const loadComplaints = async (contractInstance) => {
    if (!contractInstance) return;
    try {
      const count = await contractInstance.complaintCounter();
      const list = [];
      for (let i = 1; i <= count; i++) {
        const c = await contractInstance.getComplaint(i);
        list.push({
          id: c[0].toString(),
          name: c[1],
          cnic: c[2],
          title: c[3],
          description: c[4],
          complainant: c[5],
          resolved: c[6],
          timestamp: c[7].toString()
        });
      }
      setComplaints(list.reverse());
    } catch (error) {
      console.error(error);
    }
  };

  const fileComplaint = async (e) => {
    e.preventDefault();
    if (!contract) return toast.error("Connect wallet first");
    
    setLoading(true);
    try {
      const tx = await contract.fileComplaint(
        form.name, form.cnic, form.title, form.description
      );
      await tx.wait();
      toast.success("Complaint filed!");
      setForm({ name: "", cnic: "", title: "", description: "" });
      await loadComplaints(contract);
    } catch (error) {
      toast.error(error.message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  const resolveComplaint = async (id) => {
    if (!contract) return;
    try {
      const tx = await contract.resolveComplaint(id);
      await tx.wait();
      toast.success(`Complaint ${id} resolved!`);
      await loadComplaints(contract);
    } catch (error) {
      toast.error("Error: " + error.message);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "auto", fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "20px",
        padding: "15px 20px",
        background: "#1a1a2e",
        borderRadius: "12px",
        color: "white"
      }}>
        <h1 style={{ margin: 0, fontSize: "20px" }}>📋 FIR Registration System</h1>
        {!account ? (
          <button onClick={connectWallet} style={{ padding: "10px 25px", background: "#e94560", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
            🔌 Connect MetaMask
          </button>
        ) : (
          <div style={{ background: "#0f3460", padding: "8px 18px", borderRadius: "25px", fontSize: "13px" }}>
            ✅ {account.slice(0,6)}...{account.slice(-4)}
          </div>
        )}
      </div>

      {account && (
        <>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "25px" }}>
            <div style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: "15px", borderRadius: "12px", color: "white", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "12px", opacity: 0.8 }}>Contract Address</p>
              <p style={{ margin: "5px 0 0", fontSize: "13px", fontWeight: "bold" }}>{contractAddress.slice(0,10)}...{contractAddress.slice(-8)}</p>
            </div>
            <div style={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", padding: "15px", borderRadius: "12px", color: "white", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "12px", opacity: 0.8 }}>Total Complaints</p>
              <p style={{ margin: "5px 0 0", fontSize: "32px", fontWeight: "bold" }}>{complaints.length}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={fileComplaint} style={{ background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.08)", marginBottom: "30px" }}>
            <h2 style={{ margin: "0 0 20px 0", color: "#333" }}>📝 File a Complaint</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <input type="text" placeholder="👤 Full Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} style={{ padding: "12px", border: "1px solid #ddd", borderRadius: "8px" }} required />
              <input type="text" placeholder="🆔 CNIC Number" value={form.cnic} onChange={(e) => setForm({...form, cnic: e.target.value})} style={{ padding: "12px", border: "1px solid #ddd", borderRadius: "8px" }} required />
            </div>
            <input type="text" placeholder="📌 Complaint Title" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} style={{ width: "100%", padding: "12px", margin: "15px 0", border: "1px solid #ddd", borderRadius: "8px" }} required />
            <textarea placeholder="📄 Description" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows="4" style={{ width: "100%", padding: "12px", border: "1px solid #ddd", borderRadius: "8px" }} required />
            <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: "bold", marginTop: "10px" }}>
              {loading ? "Processing..." : "Submit to Blockchain"}
            </button>
          </form>

          {/* Complaints List - NO PENDING TEXT */}
          <div>
            <h2 style={{ marginBottom: "15px", color: "#333" }}>📋 All Complaints ({complaints.length})</h2>
            {complaints.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px", background: "#f8f9fa", borderRadius: "12px" }}>
                <p style={{ color: "#888" }}>No complaints yet.</p>
              </div>
            )}
            {complaints.map((c) => (
              <div key={c.id} style={{ background: "white", padding: "20px", margin: "15px 0", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  <h3 style={{ margin: 0, color: "#333" }}>📋 Complaint #{c.id}</h3>
                  {/* Only show RESOLVED badge, no PENDING */}
                  {c.resolved && (
                    <span style={{ padding: "4px 14px", borderRadius: "25px", background: "#d4edda", color: "#155724", fontSize: "12px", fontWeight: "bold" }}>
                      ✅ RESOLVED
                    </span>
                  )}
                </div>
                
                <p style={{ margin: "8px 0" }}><strong>👤 Name:</strong> {c.name}</p>
                <p style={{ margin: "8px 0" }}><strong>🆔 CNIC:</strong> {c.cnic}</p>
                <p style={{ margin: "8px 0" }}><strong>📌 Title:</strong> {c.title}</p>
                <p style={{ margin: "8px 0" }}><strong>📄 Description:</strong> {c.description}</p>
                <p style={{ margin: "8px 0", fontSize: "12px", color: "#666" }}><strong>📅 Date:</strong> {new Date(parseInt(c.timestamp) * 1000).toLocaleString()}</p>
                
                {!c.resolved && (
                  <button onClick={() => resolveComplaint(c.id)} style={{ marginTop: "15px", padding: "8px 22px", background: "#28a745", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
                    ✅ Resolve Complaint
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}