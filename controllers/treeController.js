import asyncHandler from 'express-async-handler';
import Tree from '..//models/userTree.js'
import User from '../models/userModel.js';

const findNodes = asyncHandler(async (email, cycle) => {
  const invitees = await Tree.find({ email: email, cycle: cycle });
  let tree_users = [];
  let nodes = []; // Array to store all nodes

  if (invitees) {
    try {
      await Promise.all(
        invitees.map(async (invitee) => {
          const iemail = invitee.node;
          const tree_user = await User.findOne({ email: iemail });
          if (tree_user) {
            tree_users.push(tree_user);
          }
        })
      );

      if (tree_users && tree_users.length > 0) {
        // Loop through all tree_users to create nodes
        tree_users.forEach((tree_user) => {
          const node = {
            username: tree_user.username,
            email: tree_user.email,
            avatar: tree_user.avatar,
          };
          nodes.push(node);
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  return nodes;
});


const showTree = asyncHandler(async (req, res) =>{
  const { email, cycle } = req.body;
  
  let nodes= await findNodes(email, cycle);
  let node1 = nodes[0];
  let node2 = nodes[1];
  let node11 = {};
  let node12 = {};
  let node21 = {};
  let node22 = {};
  
  if (node1) {
     [ node11, node12 ]  = await findNodes(node1.email, cycle);

  }
  
  if (node2) {
     [ node21, node22 ]  = await findNodes(node2.email, cycle);
  }

  let i = 2;
  if (nodes.length > 2) {
    if (!node11 && i < nodes.length) {
      node11 = nodes[i++];
    }
    if (!node12 && i < nodes.length) {
      node12 = nodes[i++];
    }
    if (!node21 && i < nodes.length) {
      node21 = nodes[i++];
    }
    if (!node22 && i < nodes.length) {
      node22 = nodes[i++];
    }
  }

  res.json({
    node1: node1 || {},
    node2: node2 || {},
    node11: node11 || {},
    node12: node12 || {},
    node21: node21 || {},
    node22: node22 || {},
  });
});

export {
  showTree
};
