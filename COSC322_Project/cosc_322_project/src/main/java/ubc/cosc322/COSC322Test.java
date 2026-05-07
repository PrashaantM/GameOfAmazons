package ubc.cosc322;

import java.util.ArrayList;
import java.util.Map;

import ygraph.ai.smartfox.games.BaseGameGUI;
import ygraph.ai.smartfox.games.GameClient;
import ygraph.ai.smartfox.games.GameMessage;
import ygraph.ai.smartfox.games.GamePlayer;
import ygraph.ai.smartfox.games.amazons.AmazonsGameMessage;

public class COSC322Test extends GamePlayer {

    private AmazonAI ai;
    private ArrayList<Integer> currentGameState = null;
    private GameClient gameClient = null;
    private BaseGameGUI gamegui  = null;
    private boolean myTurn = false;
    private String userName = null;
    private String passwd   = null;

    public static void main(String[] args) {
        COSC322Test player = new COSC322Test("player1", "pass1");
        if (player.getGameGUI() == null) {
            player.Go();
        } else {
            BaseGameGUI.sys_setup();
            java.awt.EventQueue.invokeLater(player::Go);
        }
    }

    public COSC322Test(String userName, String passwd) {
        this.userName   = userName;
        this.passwd     = passwd;
        this.gameClient = new GameClient(userName, passwd, this);
        this.gamegui    = new BaseGameGUI(this);
        this.ai         = new AmazonAI(AmazonAI.BLACK);
    }

    @Override
    public void onLogin() {
        userName = gameClient.getUserName();
        if (gamegui != null) gamegui.setRoomInformation(gameClient.getRoomList());
    }

    @Override
    public boolean handleGameMessage(String messageType, Map<String, Object> msgDetails) {
        System.out.println("Message received: " + messageType);

        if (messageType.equals(GameMessage.GAME_STATE_BOARD)) {
            @SuppressWarnings("unchecked")
            ArrayList<Integer> gs = (ArrayList<Integer>) msgDetails.get(AmazonsGameMessage.GAME_STATE);
            if (gs != null) {
                gamegui.setGameState(gs);
                currentGameState = gs;
            }

        } else if (messageType.equals(GameMessage.GAME_ACTION_START)) {
            String whitePlayer = (String) msgDetails.get(AmazonsGameMessage.PLAYER_WHITE);
            boolean iAmWhite = (whitePlayer != null && whitePlayer.equals(userName));
            ai = new AmazonAI(iAmWhite ? AmazonAI.WHITE : AmazonAI.BLACK);
            System.out.println("Playing as: " + (ai.getMyColour() == AmazonAI.BLACK ? "BLACK" : "WHITE"));
            myTurn = (ai.getMyColour() == AmazonAI.BLACK);
            if (myTurn && currentGameState != null) makeAndSendMove();

        } else if (messageType.equals(GameMessage.GAME_ACTION_MOVE)) {
            if (msgDetails == null || currentGameState == null) return true;
            gamegui.updateGameState(msgDetails);

            @SuppressWarnings("unchecked") ArrayList<Integer> queenFrom = (ArrayList<Integer>) msgDetails.get(AmazonsGameMessage.QUEEN_POS_CURR);
            @SuppressWarnings("unchecked") ArrayList<Integer> queenTo   = (ArrayList<Integer>) msgDetails.get(AmazonsGameMessage.QUEEN_POS_NEXT);
            @SuppressWarnings("unchecked") ArrayList<Integer> arrowTo   = (ArrayList<Integer>) msgDetails.get(AmazonsGameMessage.ARROW_POS);
            if (queenFrom == null || queenTo == null || arrowTo == null) return true;

            applyToState(queenFrom.get(0), queenFrom.get(1),
                         queenTo.get(0),   queenTo.get(1),
                         arrowTo.get(0),   arrowTo.get(1));

            myTurn = !myTurn;
            if (myTurn) makeAndSendMove();
        }
        return true;
    }

    private void applyToState(int fromR, int fromC, int toR, int toC, int arrR, int arrC) {
        int fromIdx  = fromR * 11 + fromC;
        int toIdx    = toR   * 11 + toC;
        int arrIdx   = arrR  * 11 + arrC;
        int val      = currentGameState.get(fromIdx);
        currentGameState.set(fromIdx, 0);
        currentGameState.set(toIdx,   val);
        currentGameState.set(arrIdx,  3);
    }

    @Override public String userName()          { return userName; }
    @Override public GameClient getGameClient() { return gameClient; }
    @Override public BaseGameGUI getGameGUI()   { return gamegui; }
    @Override public void connect()             { gameClient = new GameClient(userName, passwd, this); }

    private void makeAndSendMove() {
        if (ai == null || currentGameState == null) return;
        int[][] board = ai.convertTo2D(currentGameState);
        System.out.println("MCTS thinking (up to 45s using " +
                Math.max(1, Runtime.getRuntime().availableProcessors() - 1) + " threads)...");
        try {
            long t0   = System.currentTimeMillis();
            Move best = ai.getBestMove(board);
            System.out.println("MCTS done in " + (System.currentTimeMillis() - t0) + " ms");
            if (best == null) { System.out.println("No legal moves."); return; }
            System.out.printf("Move: (%d,%d)->(%d,%d) arrow(%d,%d)%n",
                    best.startX, best.startY, best.endX, best.endY, best.arrowX, best.arrowY);
            sendMove(best);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        myTurn = false;
    }

    private void sendMove(Move move) {
        int fromRow = move.startX + 1, fromCol = move.startY + 1;
        int toRow   = move.endX   + 1, toCol   = move.endY   + 1;
        int arrRow  = move.arrowX + 1, arrCol  = move.arrowY + 1;

        applyToState(fromRow, fromCol, toRow, toCol, arrRow, arrCol);

        ArrayList<Integer> qf = new ArrayList<>(); qf.add(fromRow); qf.add(fromCol);
        ArrayList<Integer> qt = new ArrayList<>(); qt.add(toRow);   qt.add(toCol);
        ArrayList<Integer> at = new ArrayList<>(); at.add(arrRow);  at.add(arrCol);
        gameClient.sendMoveMessage(qf, qt, at);
    }
}