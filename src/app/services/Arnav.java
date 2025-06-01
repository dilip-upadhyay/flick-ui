import javax.swing.*;
import java.awt.*;
import java.awt.event.*;
import java.util.ArrayList;
import java.util.Random;

public class CarGame extends JPanel implements ActionListener, KeyListener {
    private Timer timer;
    private int carX = 375; // Car starting position
    private int carY = 500;
    private int carSpeed = 5;
    private ArrayList<Rectangle> obstacles;
    private int obstacleSpeed = 3;
    private int score = 0;
    private boolean gameOver = false;
    private Random random;
    
    // Game window dimensions
    private final int WINDOW_WIDTH = 800;
    private final int WINDOW_HEIGHT = 600;
    private final int CAR_WIDTH = 50;
    private final int CAR_HEIGHT = 80;
    private final int ROAD_WIDTH = 400;
    private final int ROAD_X = (WINDOW_WIDTH - ROAD_WIDTH) / 2;
    
    public CarGame() {
        this.setPreferredSize(new Dimension(WINDOW_WIDTH, WINDOW_HEIGHT));
        this.setBackground(Color.GREEN);
        this.setFocusable(true);
        this.addKeyListener(this);
        
        obstacles = new ArrayList<>();
        random = new Random();
        timer = new Timer(20, this);
        timer.start();
        
        // Generate initial obstacles
        generateObstacles();
    }
    
    public void paintComponent(Graphics g) {
        super.paintComponent(g);
        draw(g);
    }
    
    public void draw(Graphics g) {
        // Draw road
        g.setColor(Color.GRAY);
        g.fillRect(ROAD_X, 0, ROAD_WIDTH, WINDOW_HEIGHT);
        
        // Draw road lines
        g.setColor(Color.WHITE);
        for (int y = 0; y < WINDOW_HEIGHT; y += 40) {
            g.fillRect(ROAD_X + ROAD_WIDTH / 2 - 2, y, 4, 20);
        }
        
        // Draw road edges
        g.setColor(Color.YELLOW);
        g.fillRect(ROAD_X - 5, 0, 5, WINDOW_HEIGHT);
        g.fillRect(ROAD_X + ROAD_WIDTH, 0, 5, WINDOW_HEIGHT);
        
        // Draw player car
        g.setColor(Color.BLUE);
        g.fillRect(carX, carY, CAR_WIDTH, CAR_HEIGHT);
        g.setColor(Color.CYAN);
        g.fillRect(carX + 10, carY + 10, 30, 60);
        
        // Draw obstacles (enemy cars)
        g.setColor(Color.RED);
        for (Rectangle obstacle : obstacles) {
            g.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            g.setColor(Color.ORANGE);
            g.fillRect(obstacle.x + 10, obstacle.y + 10, obstacle.width - 20, obstacle.height - 20);
            g.setColor(Color.RED);
        }
        
        // Draw score
        g.setColor(Color.BLACK);
        g.setFont(new Font("Arial", Font.BOLD, 20));
        g.drawString("Score: " + score, 10, 30);
        
        // Draw speed
        g.drawString("Speed: " + obstacleSpeed, 10, 60);
        
        // Draw game over message
        if (gameOver) {
            g.setColor(Color.RED);
            g.setFont(new Font("Arial", Font.BOLD, 40));
            g.drawString("GAME OVER!", WINDOW_WIDTH/2 - 120, WINDOW_HEIGHT/2);
            g.setFont(new Font("Arial", Font.BOLD, 20));
            g.drawString("Press R to Restart", WINDOW_WIDTH/2 - 80, WINDOW_HEIGHT/2 + 40);
        }
        
        // Draw instructions
        if (!gameOver) {
            g.setColor(Color.BLACK);
            g.setFont(new Font("Arial", Font.PLAIN, 12));
            g.drawString("Use A/D or Arrow Keys to move", 10, WINDOW_HEIGHT - 40);
            g.drawString("Avoid the red cars!", 10, WINDOW_HEIGHT - 20);
        }
    }
    
    public void actionPerformed(ActionEvent e) {
        if (!gameOver) {
            moveObstacles();
            checkCollisions();
            updateScore();
            generateObstacles();
        }
        repaint();
    }
    
    public void moveObstacles() {
        for (int i = 0; i < obstacles.size(); i++) {
            Rectangle obstacle = obstacles.get(i);
            obstacle.y += obstacleSpeed;
            
            // Remove obstacles that have gone off screen
            if (obstacle.y > WINDOW_HEIGHT) {
                obstacles.remove(i);
                i--;
                score += 10;
            }
        }
    }
    
    public void generateObstacles() {
        if (random.nextInt(100) < 3) { // 3% chance each frame
            int obstacleX = ROAD_X + random.nextInt(ROAD_WIDTH - CAR_WIDTH);
            obstacles.add(new Rectangle(obstacleX, -CAR_HEIGHT, CAR_WIDTH, CAR_HEIGHT));
        }
    }
    
    public void checkCollisions() {
        Rectangle playerRect = new Rectangle(carX, carY, CAR_WIDTH, CAR_HEIGHT);
        
        for (Rectangle obstacle : obstacles) {
            if (playerRect.intersects(obstacle)) {
                gameOver = true;
                timer.stop();
                break;
            }
        }
        
        // Check if car is off the road
        if (carX < ROAD_X || carX + CAR_WIDTH > ROAD_X + ROAD_WIDTH) {
            gameOver = true;
            timer.stop();
        }
    }
    
    public void updateScore() {
        // Increase difficulty over time
        if (score > 0 && score % 100 == 0) {
            obstacleSpeed++;
        }
    }
    
    public void restartGame() {
        carX = 375;
        carY = 500;
        obstacles.clear();
        score = 0;
        obstacleSpeed = 3;
        gameOver = false;
        timer.start();
    }
    
    @Override
    public void keyPressed(KeyEvent e) {
        int key = e.getKeyCode();
        
        if (!gameOver) {
            // Move left
            if (key == KeyEvent.VK_A || key == KeyEvent.VK_LEFT) {
                if (carX > ROAD_X) {
                    carX -= carSpeed;
                }
            }
            // Move right
            if (key == KeyEvent.VK_D || key == KeyEvent.VK_RIGHT) {
                if (carX < ROAD_X + ROAD_WIDTH - CAR_WIDTH) {
                    carX += carSpeed;
                }
            }
        }
        
        // Restart game
        if (key == KeyEvent.VK_R && gameOver) {
            restartGame();
        }
    }
    
    @Override
    public void keyTyped(KeyEvent e) {}
    
    @Override
    public void keyReleased(KeyEvent e) {}
    
    public static void main(String[] args) {
        JFrame frame = new JFrame("Car Racing Game");
        CarGame game = new CarGame();
        
        frame.add(game);
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.setResizable(false);
        frame.pack();
        frame.setLocationRelativeTo(null);
        frame.setVisible(true);
    }
}
