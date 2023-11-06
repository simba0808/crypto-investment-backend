import asyncHandler from 'express-async-handler';
import Tree from '../models/userTree.js'
import User from '../models/userModel.js';

const findNodes = asyncHandler(async (email, cycle) => {
  const invitees = await Tree.find({ email: email, cycle: cycle }).sort({ _id: 1 });
  let tree_users = [];
  let nodes = []; // Array to store all nodes

  if (invitees) {
    try {
      await Promise.all(
        invitees.map(async (invitee) => {
          const iemail = invitee.node;
          const tree_user = await User.findOne({ email: iemail }).sort({ _id: 1 });
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
            cycle: tree_user.cycle,
            updatedAt : tree_user.updatedAt,
          };
          nodes.push(node);
        });
      }
    } catch (err) {
      console.error(err);
    }
  }
  nodes.sort((a, b) => {
    return new Date(a.updatedAt) - new Date(b.updatedAt);
  });

  return nodes;
  
});


const showTree = asyncHandler(async (req, res) =>{
  const { email, cycle } = req.body;
  
  let nodes= await findNodes(email, cycle);
  nodes.sort((a, b) => {
    return new Date(a.updatedAt) - new Date(b.updatedAt);
  });
  let node1 = nodes[0];
  let node2 = nodes[1];
  let node11 = {};
  let node12 = {};
  let node21 = {};
  let node22 = {};
  
  if (node1) {
     [ node11, node12 ]  = await findNodes(node1.email, node1.cycle);
  }
  
  if (node2) {
     [ node21, node22 ]  = await findNodes(node2.email, node2.cycle);
  }

  let i = 2;
  if (nodes.length > 2) {
    if (!node11 && i < nodes.length) {
      node11 = nodes[i++];
      console.log(node11.email);
      const tree =await Tree.findOne({node : node11.email});
      if(tree) 
      { 
        console.log(tree.email);
        tree.email = node1.email;
        const updatedTree =await tree.save();
        if(updatedTree) console.log("Main node changed to child node", updatedTree.email);   
      }
    }
    if (!node12 && i < nodes.length) {
      node12 = nodes[i++];
      console.log(node12.email);
      const tree =await Tree.findOne({node : node12.email});
      if(tree) 
      { 
        console.log(tree.email);
        tree.email = node1.email;
        const updatedTree =await tree.save();
        if(updatedTree) console.log("Main node changed to child node", updatedTree.email);   
      }
    }
    if (!node21 && i < nodes.length) {
      node21 = nodes[i++];
      console.log(node21.email);
      const tree =await Tree.findOne({node : node21.email});
      if(tree) 
      { 
        console.log(tree.email);
        tree.email = node2.email;
        const updatedTree =await tree.save();
        if(updatedTree) console.log("Main node changed to child node", updatedTree.email);   
      }
    }
    if (!node22 && i < nodes.length) {
      node22 = nodes[i++];
      console.log(node22.email);
      const tree =await Tree.findOne({node : node22.email});
      if(tree) 
      { 
        console.log(tree.email);
        tree.email = node2.email;
        const updatedTree =await tree.save();
        if(updatedTree) console.log("Main node changed to child node", updatedTree.email);   
      }
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

const getProgress = asyncHandler(async (email, cycle) =>{
  
  let nodes= await findNodes(email, cycle);
  nodes.sort((a, b) => {
    return new Date(a.updatedAt) - new Date(b.updatedAt);
  });
  let node1 = nodes[0];
  let node2 = nodes[1];
  let node11 = {};
  let node12 = {};
  let node21 = {};
  let node22 = {};
  
  if (node1) {
     [ node11, node12 ]  = await findNodes(node1.email, node1.cycle);
  }
  
  if (node2) {
     [ node21, node22 ]  = await findNodes(node2.email, node2.cycle);
  }

  let i = 2;
  if (nodes.length > 2) {
    if (!node11 && i < nodes.length) {
      node11 = nodes[i++];
      console.log(node11.email);
      const tree =await Tree.findOne({node : node11.email});
      if(tree) 
      { 
        console.log(tree.email);
        tree.email = node1.email;
        const updatedTree =await tree.save();
        if(updatedTree) console.log("Main node changed to child node", updatedTree.email);   
      }
    }
    if (!node12 && i < nodes.length) {
      node12 = nodes[i++];
      console.log(node12.email);
      const tree =await Tree.findOne({node : node12.email});
      if(tree) 
      { 
        console.log(tree.email);
        tree.email = node1.email;
        const updatedTree =await tree.save();
        if(updatedTree) console.log("Main node changed to child node", updatedTree.email);   
      }
    }
    if (!node21 && i < nodes.length) {
      node21 = nodes[i++];
      console.log(node21.email);
      const tree =await Tree.findOne({node : node21.email});
      if(tree) 
      { 
        console.log(tree.email);
        tree.email = node2.email;
        const updatedTree =await tree.save();
        if(updatedTree) console.log("Main node changed to child node", updatedTree.email);   
      }
    }
    if (!node22 && i < nodes.length) {
      node22 = nodes[i++];
      console.log(node22.email);
      const tree =await Tree.findOne({node : node22.email});
      if(tree) 
      { 
        console.log(tree.email);
        tree.email = node2.email;
        const updatedTree =await tree.save();
        if(updatedTree) console.log("Main node changed to child node", updatedTree.email);   
      }
    }
  }

  const list = ({
    node1: node1 || {},
    node2: node2 || {},
    node11: node11 || {},
    node12: node12 || {},
    node21: node21 || {},
    node22: node22 || {},
  });

  let percentage = (list.node1.email?1:0)*25 + (list.node2.email?1:0)*25 + (list.node11.email?1:0)*12.5 + (list.node12.email?1:0)*12.5 + (list.node21.email?1:0)*12.5 + (list.node22.email?1:0)*12.5;
  return percentage;
});

export {
  showTree, getProgress
};
