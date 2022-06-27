const Voting = artifacts.require("./Voting.sol");

const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

contract('Voting', accounts => {

    const owner = accounts[0];
    const voter_one = accounts[1];
    const voter_two = accounts[2];
    const non_voter = accounts[10];

    const WorkflowStatusRegisteringVoters = new BN(0);
    const WorkflowStatusProposalsRegistrationStarted = new BN(1);
    const WorkflowStatusProposalsRegistrationEnded = new BN(2);
    const WorkflowStatusVotingSessionStarted = new BN(3);
    const WorkflowStatusVotingSessionEnded = new BN(4);
    const WorkflowStatusVotesTallied = new BN(5);

    let votingInstance;

    describe("Test registration step", function () {

        beforeEach(async function () {
            //create a new contract instance
            votingInstance = await Voting.new({from:owner});
            //add voter_one
            await votingInstance.addVoter(voter_one, { from: owner });
        });
        
        context("- Scenarios", () => {

            it("should add multiple voters", async () => {

                for(let i=3; i<7; i++){
                    await votingInstance.addVoter(accounts[i], { from: owner });
                    const voterData = await votingInstance.getVoter(accounts[i], { from: voter_one });
                
                    expect(voterData.isRegistered).to.be.true;
                }

            });

            it("should get a voter", async () => {

                const voterData = await votingInstance.getVoter(voter_one, { from: voter_one });
                
                expect(voterData.isRegistered).to.be.true;
            });

            it("should have hasVoted setted to false for a new voter", async () => {

                await votingInstance.addVoter(voter_two, { from: owner });
                const voterData = await votingInstance.getVoter(voter_one, { from: voter_one });
                
                expect(voterData.hasVoted).to.be.false;
            });
            
        });

        context("- Requires", () => {

            it("should revert on adding a voter from an account who isn't the contract owner", async () => {
                //voter_one try to add voter_two
                await expectRevert(votingInstance.addVoter(voter_two, { from: voter_one }), "Ownable: caller is not the owner");
            });

            it("should revert on adding a voter already registred", async () => {
                //try to add voter_one again
                await expectRevert(votingInstance.addVoter(voter_one, { from: owner }), "Already registered");
            });

            it("should revert on adding a voter during wrong step", async () => {
                //end voter registration step
                await votingInstance.startProposalsRegistering({ from: owner });

                //try to add voter_two
                await expectRevert(votingInstance.addVoter(voter_two, { from: owner }), "Voters registration is not open yet");
            });

        });

        context("- Events", () => {

            it("should emit event on addVoter", async () => {

                expectEvent(await votingInstance.addVoter(voter_two, { from: owner }), "VoterRegistered" ,{voterAddress: voter_two})

            });

        });
    });


    describe("Test add proposal step", function () {

        beforeEach(async function () {

            //create a new contract instance
            votingInstance = await Voting.new({from:owner});
            //add voter_one & voter_two
            await votingInstance.addVoter(voter_one, { from: owner });
            await votingInstance.addVoter(voter_two, { from: owner });

            //start proposals registration step
            await votingInstance.startProposalsRegistering({ from: owner });
        });

        context("Scenarios", () => {

            it("should add a proposal", async () => {
                await votingInstance.addProposal("Tous riches", { from: voter_one });
                const proposalData = await votingInstance.getOneProposal(0, { from: voter_one });
                
                expect(proposalData.description).to.equal("Tous riches");
            });

            it("should have count number setted to 0 for a new proposal", async () => {
                await votingInstance.addProposal("Tous libres", { from: voter_one });
                const proposalData = await votingInstance.getOneProposal(new BN(0), { from: voter_one });
                
                expect(new BN(proposalData.voteCount)).to.be.bignumber.equal(new BN(0));
            });

        });

        context("Requires", () => {
            it("should revert on adding a proposal from an account who isn't a voter", async () => {
                //add a proposal from a non voter
                await expectRevert(votingInstance.addProposal("Tous pauvres", { from: non_voter }), "You're not a voter");
            });

            it("should revert on adding a proposal during wrong step", async () => {
                //end proposal registration step
                await votingInstance.endProposalsRegistering({ from: owner });

                //try to add a proposal
                await expectRevert(votingInstance.addProposal("Tous pauvres", { from: voter_one }), "Proposals are not allowed yet");
            });

            it("should revert on adding an empty proposal ", async () => {
                //add an empty proposal from voter_one
                await expectRevert(votingInstance.addProposal("", { from: voter_one }), "Vous ne pouvez pas ne rien proposer");
            });

        });

        context("Events", () => {

            it("should emit event on addProposal", async () => {

                expectEvent(await votingInstance.addProposal("Tous égaux", { from: voter_one }), "ProposalRegistered" ,{proposalId: new BN(0)});

            });

        });

    });

    describe("Test vote step", function () {

        beforeEach(async function () {

            //create a new contract instance
            votingInstance = await Voting.new({from:owner});
            //add voter_one & voter_two
            await votingInstance.addVoter(voter_one, { from: owner });
            await votingInstance.addVoter(voter_two, { from: owner });

            //start proposals registration step
            await votingInstance.startProposalsRegistering({ from: owner });
            //add proposals
            await votingInstance.addProposal("Tous riches", { from: voter_one });
            await votingInstance.addProposal("Tous libres", { from: voter_one });
            await votingInstance.addProposal("Tous égaux", { from: voter_two });
            await votingInstance.addProposal("Tous intelligent", { from: voter_two });

            //start voting step
            await votingInstance.endProposalsRegistering({ from: owner });
            await votingInstance.startVotingSession({ from: owner });
            
        });

        context("Scenarios", () => {

            it("should increment count number after voting for first proposal", async () => {
                await votingInstance.setVote(new BN(0), { from: voter_one });
                const proposalData = await votingInstance.getOneProposal(new BN(0), { from: voter_one });
                
                expect(proposalData.voteCount).to.be.bignumber.equal(new BN(1));
            });

            it("should set voter as has voted after voting for second proposal", async () => {
                await votingInstance.setVote(new BN(1), { from: voter_one });
                const voterData = await votingInstance.getVoter(voter_one, { from: voter_one });
                
                expect(voterData.hasVoted).to.be.true;
            });

            it("should set voted proposal id after voting for third proposal", async () => {
                await votingInstance.setVote(new BN(2), { from: voter_one });
                const voterData = await votingInstance.getVoter(voter_one, { from: voter_one });
                
                expect(voterData.votedProposalId).to.be.bignumber.equal(new BN(2));
            });
        });

        context("Requires", () => {

            it("should revert on voting from an account who isn't a voter", async () => {
                //add a proposal from a non voter
                await expectRevert(votingInstance.setVote(new BN(0), { from: non_voter }), "You're not a voter");
            });

            it("should revert on voting during wrong step", async () => {
                //end voting session step
                await votingInstance.endVotingSession({ from: owner });

                //try to vote
                await expectRevert(votingInstance.setVote(new BN(0), { from: voter_one }), "Voting session havent started yet");
            });

            it("should revert on voting a second time ", async () => {
                //voter_one vote for first proposal
                await votingInstance.setVote(new BN(0), { from: voter_one });

                //voter_one try to vote for second proposal
                await expectRevert(votingInstance.setVote(new BN(1), { from: voter_one }), "You have already voted");
            });

            it("should revert on voting for an unknown proposal ", async () => {
                //add an empty proposal from voter_one
                await expectRevert(votingInstance.setVote(new BN(4), { from: voter_one }), "Proposal not found");
            });
        });

        context("Events", () => {

            it("should emit event on setVote", async () => {

                expectEvent(await votingInstance.setVote(new BN(0), { from: voter_one }), "Voted" ,{voter: voter_one, proposalId: new BN(0)});

            });

        });

    }); 

    describe("Test tally step", function () {

        beforeEach(async function () {

            //create a new contract instance
            votingInstance = await Voting.new({from:owner});
            //add voter_one & voter_two
            await votingInstance.addVoter(voter_one, { from: owner });
            await votingInstance.addVoter(voter_two, { from: owner });

            //start proposals registration step
            await votingInstance.startProposalsRegistering({ from: owner });
            //add proposals
            await votingInstance.addProposal("Tous riches", { from: voter_one });
            await votingInstance.addProposal("Tous libres", { from: voter_one });
            await votingInstance.addProposal("Tous égaux", { from: voter_two });
            await votingInstance.addProposal("Tous intelligent", { from: voter_two });

            //start voting step
            await votingInstance.endProposalsRegistering({ from: owner });
            await votingInstance.startVotingSession({ from: owner });
            //vote
            await votingInstance.setVote(new BN(1), { from: voter_one });
            await votingInstance.setVote(new BN(1), { from: voter_two });

            //start tally step
            await votingInstance.endVotingSession({ from: owner });
        });

        context("Scenarios", () => {

            it("should set winning proposal the second proposal", async () => {
                await votingInstance.tallyVotes({ from: owner });

                const winningProposalId = await votingInstance.winningProposalID();
                
                expect(winningProposalId).to.be.bignumber.equal(new BN(1));
            });

            it("should set workflowStatus to VotesTallied", async () => {
                await votingInstance.tallyVotes({ from: owner });

                const workflowStatus = await votingInstance.workflowStatus();
                
                expect(workflowStatus).to.be.bignumber.equal(new BN(WorkflowStatusVotesTallied));
            });

        });

        context("Requires", () => {

            it("should revert on talling votes from an account who isn't the contract owner", async () => {
                //voter_one try to tally vote
                await expectRevert(votingInstance.tallyVotes({ from: voter_one }), "Ownable: caller is not the owner");
            });

            it("should revert on talling votes during wrong step", async () => {
                //create a new instance of contract to reset workflowstatus
                //let localVotingInstance = await Voting.new({from:owner});
                await votingInstance.tallyVotes({ from: owner });

                //try to tally vote
                await expectRevert(votingInstance.tallyVotes({ from: owner }), "Current status is not voting session ended");
            });
        });

        context("Event", () => {
            
            it("should emit workflowStatus event on tallyVotes", async () => {

                expectEvent(await votingInstance.tallyVotes({ from: owner }), "WorkflowStatusChange" ,{previousStatus: WorkflowStatusVotingSessionEnded, newStatus: WorkflowStatusVotesTallied});

            });

        });

    });

    describe("Test step changement", function () {

        before(async function () {
            //create a new contract instance
            votingInstance = await Voting.new({from:owner})
        });

        context("Event", () => {
            
            it("should emit workflowStatus event on startProposalsRegistering", async () => {

                expectEvent(await votingInstance.startProposalsRegistering({ from: owner }), "WorkflowStatusChange" ,{previousStatus: WorkflowStatusRegisteringVoters, newStatus: WorkflowStatusProposalsRegistrationStarted});

            });

            it("should emit workflowStatus event on endProposalsRegistering", async () => {

                expectEvent(await votingInstance.endProposalsRegistering({ from: owner }), "WorkflowStatusChange" ,{previousStatus: WorkflowStatusProposalsRegistrationStarted, newStatus: WorkflowStatusProposalsRegistrationEnded});

            });

            it("should emit workflowStatus event on startVotingSession", async () => {

                expectEvent(await votingInstance.startVotingSession({ from: owner }), "WorkflowStatusChange" ,{previousStatus: WorkflowStatusProposalsRegistrationEnded, newStatus: WorkflowStatusVotingSessionStarted});

            });

            it("should emit workflowStatus event on endVotingSession", async () => {

                expectEvent(await votingInstance.endVotingSession({ from: owner }), "WorkflowStatusChange" ,{previousStatus: WorkflowStatusVotingSessionStarted, newStatus: WorkflowStatusVotingSessionEnded});

            });

        });

    });

});