![](https://i.imgur.com/S8c7E8o.gif)

### LOOPY - a tool for thinking in systems
### [Version 1.2 enhanced by John Kennedy](https://efa.unisa.edu.au/Loopy)

[Zero Rights Reserved](http://creativecommons.org/publicdomain/zero/1.0/):
LOOPY is entirely open source/public domain.

To mirror LOOPY, just clone this Github Repo with the 1.2 branch.
([learn more about these free Github Pages](https://pages.github.com/))

Other Peeps' Open Source Code I Used:
- [minpubsub](https://github.com/daniellmb/MinPubSub)
- [balloon.css](https://kazzkiq.github.io/balloon.css/)
- [simple sharing buttons](https://simplesharingbuttons.com/)
- [the original Loopy](https://github.com/ncase/loopy)

Check out these [user-made LOOPY's!](http://ncase.me/loopy/v1.1/pages/examples)
---
Version 1.3:

New Features:
  - Added multi-object movement via square selection
  - Added export functionality to DOT format
  - Added Zoom In/Out support

Fixes & Changes:
  - Node text now wraps to the next line and auto-fits within the node
  - Limited selectable configuration options to five per category:
      Start Amount: 0, 0.25, 0.50, 0.75, 1
      Node Radius: 45, 60, 80, 110, 150
      Node Gain: 0.5, 0.75, 1, 1.33, 2
      Node Quantum: 0.001, 0.01, 0.1, 0.2, 0.33

Version 1.2:
- Various Changes made to Nodes including
  - Node Type added. Nodes can now be active with arrows or inactive like instruments.
  - There are 10 colours to choose from in the colour palette
  - The node radius can be set noting that this only increases the size of the node not its capacity
  - The node gain can now be set.  Gain is the ratio of the output signal from a node to its input signal when prodded by a signal.
  - The node quantum can now be set. Quantum is the size of the signal emitted from an active node when the arrows are pressed.
- Various Changes made to Edges including
  - Signal Attenuation added. How much should a signal deteriorate as it passes along an edge.  The actual attenuation happens at the mid point.
  - Signal Speed added. The speed of the signal along the edge can now be controlled as a percentage of normal speed as well as by using longer edges.
- General Changes
  - The serialise and deserialise functions have been modified to take into account the new node and edge properties (these functions are in js/model.js).
  - Simulation Settings have been added to the Serialise and Deserialise functions. This includes a maximum signal age setting by default set to 5.  That is a signal will not propagate along more than 5 edges.  This is changed at the top of js/model.js or through the data query string.

Version 1.1:
- node amounts are now "uncapped"
- better distribution of "signals"

Version 1.0: the whole everything.
