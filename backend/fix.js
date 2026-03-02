const fs = require("fs");
let code = fs.readFileSync("controllers/govPortalController.js", "utf8");
code = code.replace(/ \/ \/   6 \.(.|\n)*/g, "");
code = code.replace(/module\.exports\s*=\s*{[\s\S]*?startGovCheckCron\n};/g, "");

code += `
// 6. Admin Get All Tickets
const getAllGovTickets = async (req, res, next) => {
    try {
        const tickets = await GovTicket.find({})
            .populate("complaint", "title category location priority status")
            .populate("user", "name email")
            .sort({ createdAt: -1 });
        res.json({ success: true, tickets });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    submitToPortal,
    checkTicketStatus,
    getMyGovTickets,
    manualTrack,
    startGovCheckCron,
    getAllGovTickets
};
`;

fs.writeFileSync("controllers/govPortalController.js", code);
